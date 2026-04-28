import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Chunk text into ~500-token pieces with overlap
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const cancerType = formData.get("cancerType") as string | null;

    if (!file || !sessionId || !cancerType) {
      return NextResponse.json(
        { error: "file, sessionId, and cancerType are required" },
        { status: 400 }
      );
    }

    const validTypes = ["colon", "breast", "lymphoma"];
    if (!validTypes.includes(cancerType)) {
      return NextResponse.json(
        { error: "cancerType must be colon | breast | lymphoma" },
        { status: 400 }
      );
    }

    // Parse PDF with LlamaParse
    const llamaFormData = new FormData();
    llamaFormData.append("file", file);

    const parseRes = await fetch(
      "https://api.cloud.llamaindex.ai/api/parsing/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
        },
        body: llamaFormData,
      }
    );

    if (!parseRes.ok) {
      const err = await parseRes.text();
      console.error("LlamaParse upload error:", err);
      return NextResponse.json(
        { error: "LlamaParse upload failed" },
        { status: 500 }
      );
    }

    const { id: jobId } = await parseRes.json();

    // Poll for completion (up to 30s)
    let parsedText = "";
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));

      const resultRes = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
          },
        }
      );

      if (resultRes.ok) {
        const result = await resultRes.json();
        parsedText = result.markdown || "";
        break;
      }
    }

    if (!parsedText) {
      return NextResponse.json(
        { error: "LlamaParse did not return text in time" },
        { status: 504 }
      );
    }

    // Chunk → embed → upsert into Pinecone patient-docs namespace
    const chunks = chunkText(parsedText);
    console.log("Extracted chunks length:", chunks.length);
    const namespace = sessionId.startsWith("nccn-") ? "guidelines" : "patient-docs";
    const index = pc.index(process.env.PINECONE_INDEX_NAME!).namespace(namespace);

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await embedText(chunk);
        return {
          id: `${sessionId}-chunk-${i}`,
          values: embedding,
          metadata: {
            text: chunk,
            sessionId,
            cancerType,
            source: "pathology-report",
            chunkIndex: i,
          },
        };
      })
    );

    console.log("Vectors length to upsert:", vectors.length);
    
    if (vectors.length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted or chunked from the file" },
        { status: 400 }
      );
    }

    await index.upsert({ records: vectors });

    console.log(`✅ Ingested ${vectors.length} chunks for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      chunksIngested: vectors.length,
    });
  } catch (err) {
    console.error("❌ /api/ingest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
