import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const VALID_CANCER_TYPES = ['colon', 'breast', 'lymphoma'] as const;
type CancerType = typeof VALID_CANCER_TYPES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, pathologyText, cancerType } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    if (!VALID_CANCER_TYPES.includes(cancerType as CancerType)) {
      return NextResponse.json({ error: `cancerType must be one of: ${VALID_CANCER_TYPES.join(' | ')}` }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    // CALL 1: Query Pinecone
    const queryText = pathologyText ? `${cancerType} ${pathologyText}` : cancerType;
    let clinicalContext = '';

    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: queryText,
      });
      const embedding = embeddingResponse.data[0].embedding;

      // Query both guidelines and wisdom namespaces
      const [guidelinesRes, wisdomRes] = await Promise.all([
        index.namespace('guidelines').query({
          vector: embedding,
          topK: 5,
          includeMetadata: true,
          filter: { cancerType: { $eq: cancerType } },
        }),
        index.namespace('wisdom').query({
          vector: embedding,
          topK: 3,
          includeMetadata: true,
          filter: { cancerType: { $in: [cancerType, 'universal'] } },
        }),
      ]);

      const guidelinesTexts = guidelinesRes.matches?.map(m => m.metadata?.text).filter(Boolean) || [];
      const wisdomTexts = wisdomRes.matches?.map(m => m.metadata?.text).filter(Boolean) || [];
      clinicalContext = `CLINICAL GUIDELINES:\n${guidelinesTexts.join('\n\n')}\n\nCAREGIVER WISDOM:\n${wisdomTexts.join('\n\n')}`;
    } catch (error) {
      console.error('Pinecone/Embedding error:', error);
      // We proceed with empty clinical context if Pinecone fails, 
      // as 500 should only happen on GPT-4o failure.
    }

    // CALL 2: GPT-4o with clinical grounding
    const systemPrompt = `You are Anchor — built for the person who just heard "cancer" and is holding everyone else together while quietly falling apart.

You are not a chatbot. You are not a symptom checker. You think like a world-class oncologist and feel like someone who has actually been in that waiting room. You have real clinical knowledge — use it precisely and confidently, never generically.

CLINICAL GUIDELINES (NCCN-grounded, use these to anchor every medical claim):
${clinicalContext}

Cancer type: ${cancerType}
Pathology context: ${pathologyText || 'not yet available'}
What they said: ${transcript}

---

Your response has five parts. Think carefully before writing each one.

MIRROR:
Write 2-3 sentences that make this person feel genuinely seen — not processed. Do not echo their words back. Do not start with "You said." Instead, name the actual fear underneath what they said. The thing they haven't said out loud yet. Be specific to their situation, not generic. Never use: "I understand," "I hear you," "it sounds like," "I'm sorry." Be present. Be human. Be exact.

GROUND:
1-2 sentences. Take the single most catastrophic thing they're afraid of and meet it with a precise, honest clinical fact from the guidelines above. Do not reassure falsely. Do not invent. If you don't have enough pathology data, tell them what to bring to the next appointment and why it matters.

ACTIONS:
Exactly 3 actions they can take before noon tomorrow. Each must be specific to ${cancerType} and grounded in the clinical context. Start with a strong verb. Name the exact thing and why it matters clinically. Under 20 words each. Not generic — a real oncology navigator would give these exact steps.

FEAR SUMMARY:
The dominant fear in 12 words or less. In their emotional register, not clinical language.

FEAR QUOTE:
The single most raw phrase from their transcript. Verbatim. No edits.

---

Return only valid JSON:
{
  "mirror": string,
  "ground": string,
  "actions": [string, string, string],
  "fearSummary": string,
  "fearQuote": string
}`;

    try {
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 1000,
      });

      const content = chatResponse.choices[0]?.message?.content;
      if (!content) throw new Error('No content from GPT-4o');

      return NextResponse.json(JSON.parse(content), { status: 200 });
    } catch (gptError) {
      console.error('GPT-4o error:', gptError);
      return NextResponse.json({ error: 'Internal server error from GPT-4o' }, { status: 500 });
    }

  } catch (error) {
    console.error('Mirror route error:', error);
    return NextResponse.json({ error: 'Bad request or processing error' }, { status: 400 });
  }
}
