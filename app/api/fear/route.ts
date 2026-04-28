import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Client, Databases, ID } from "node-appwrite";

// ── Types ──────────────────────────────────────────────────────────
const VALID_CONTEXT_TAGS = [
  "diagnosis",
  "scan",
  "chemo_start",
  "post_surgery",
  "other",
] as const;

type ContextTag = (typeof VALID_CONTEXT_TAGS)[number];

interface RequestBody {
  transcript: string;
  sessionId: string;
  contextTag: ContextTag;
}

interface FearExtraction {
  fearSummary: string;
  fearQuote: string;
  contextTag: ContextTag;
}

// ── Appwrite (server-side Admin SDK) ───────────────────────────────
function buildAppwriteClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Appwrite env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY"
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return new Databases(client);
}

// ── OpenAI ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are analyzing a raw emotional rant from a cancer caregiver who is terrified and exhausted.

Extract with surgical precision:

fearSummary: The single dominant fear in 12 words or less. Be specific. Use their emotional register exactly. Not 'fear of the unknown' — 'terrified of missing a test that could hurt her'.

fearQuote: ONE exact verbatim phrase from their words. Most emotionally raw. Word for word. No cleanup.

contextTag: Return exactly the contextTag provided.

Output JSON only. No markdown. No preamble.`;

// ── Route handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Parse & validate body ────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { transcript, sessionId, contextTag } = body;

  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json(
      { error: "transcript is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return NextResponse.json(
      { error: "sessionId is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!VALID_CONTEXT_TAGS.includes(contextTag as ContextTag)) {
    return NextResponse.json(
      {
        error: `contextTag must be one of: ${VALID_CONTEXT_TAGS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // ── Call GPT-4o ──────────────────────────────────────────────────
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  let extraction: FearExtraction;
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `contextTag: ${contextTag}\n\nTranscript:\n${transcript}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[fear/route] GPT-4o returned non-JSON:", raw);
      return NextResponse.json(
        { error: "GPT-4o returned an unparseable response" },
        { status: 500 }
      );
    }

    if (!parsed.fearSummary || !parsed.fearQuote || !parsed.contextTag) {
      console.error("[fear/route] GPT-4o response missing required fields:", parsed);
      return NextResponse.json(
        { error: "GPT-4o response was missing required fields" },
        { status: 500 }
      );
    }

    extraction = {
      fearSummary: parsed.fearSummary,
      fearQuote: parsed.fearQuote,
      contextTag: contextTag, // always use the validated input value
    };
  } catch (gptErr: unknown) {
    const msg = gptErr instanceof Error ? gptErr.message : String(gptErr);
    console.error("[fear/route] GPT-4o call failed:", msg);
    return NextResponse.json({ error: `GPT-4o error: ${msg}` }, { status: 500 });
  }

  // ── Persist to Appwrite (non-fatal) ──────────────────────────────
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = "69eddc5700127a860597";

  try {
    if (!databaseId) throw new Error("Missing APPWRITE_DATABASE_ID env var");

    const databases = buildAppwriteClient();

    await databases.createDocument(databaseId, collectionId, ID.unique(), {
      sessionId,
      timestamp: new Date().toISOString(),
      fearSummary: extraction.fearSummary,
      fearQuote: extraction.fearQuote,
      contextTag: extraction.contextTag,
    });
  } catch (appwriteErr: unknown) {
    const msg =
      appwriteErr instanceof Error ? appwriteErr.message : String(appwriteErr);
    console.error("[fear/route] Appwrite write failed (non-fatal):", msg);
    // ↑ Intentionally non-fatal — we still return the fear data below
  }

  // ── Respond ──────────────────────────────────────────────────────
  return NextResponse.json(extraction, { status: 200 });
}
