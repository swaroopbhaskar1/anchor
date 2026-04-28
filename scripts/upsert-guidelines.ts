import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const { PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY } = process.env;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME || !OPENAI_API_KEY) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  console.log("🚀 Starting Pinecone guidelines upsert...\n");

  const chunks = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), "data/guidelines-chunks.json"),
      "utf-8"
    )
  );

  console.log(`📦 Loaded ${chunks.length} chunks\n`);

  const ns = pinecone.index(PINECONE_INDEX_NAME!).namespace("guidelines");

  let successCount = 0;
  let failCount = 0;

  for (const chunk of chunks) {
    try {
      console.log(`⏳ Embedding: ${chunk.id}`);
      const embedding = await embedText(chunk.text);

      // v7 requires { records: [...] } — confirmed from SDK source
      await ns.upsert({
        records: [
          {
            id: chunk.id,
            values: embedding,
            metadata: {
              text: chunk.text,
              cancerType: chunk.metadata.cancerType,
              topic: chunk.metadata.topic,
              source: chunk.metadata.source,
            },
          },
        ],
      });

      console.log(`✅ Upserted: ${chunk.id}`);
      successCount++;
      await sleep(300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed: ${chunk.id} — ${msg}`);
      failCount++;
    }
  }

  console.log(`\n🏁 Done. Success: ${successCount} | Failed: ${failCount}`);
}

main();
