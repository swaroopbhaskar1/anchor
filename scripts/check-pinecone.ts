import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const stats = await pc.index(process.env.PINECONE_INDEX_NAME!).describeIndexStats();
  console.log(JSON.stringify(stats, null, 2));
}

main();
