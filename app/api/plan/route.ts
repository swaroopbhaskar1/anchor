import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { Client, Databases, ID } from 'node-appwrite';

const VALID_CANCER_TYPES = ['colon', 'breast', 'lymphoma'] as const;
type CancerType = typeof VALID_CANCER_TYPES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fearSummary, cancerType, pathologyText, sessionId } = body;

    if (!VALID_CANCER_TYPES.includes(cancerType as CancerType)) {
      return NextResponse.json({ error: `cancerType must be one of: ${VALID_CANCER_TYPES.join(' | ')}` }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    // CALL 1: Query Pinecone
    const queryText = `${cancerType} ${fearSummary} actions next steps`;
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
      // Proceed with empty clinical context if Pinecone fails
    }

    // CALL 2: GPT-4o with clinical grounding
    const systemPrompt = `You are Anchor — a navigator for cancer caregivers.
You have been given REAL clinical guidelines below.
Build a specific 72-hour action plan grounded entirely 
in this data. Never invent protocols or resources.

CLINICAL GUIDELINES:
${clinicalContext}

Cancer type: ${cancerType}
Primary fear: ${fearSummary || ''}
Pathology context: ${pathologyText || ''}

Build a 72-hour plan with exactly 3 sections.
Each section has exactly 3 actions.

Rules for every action:
- Doable in the specified timeframe
- Specific to cancerType and pathology
- Starts with strong verb: Call/Ask/Request/Confirm/Write/Get
- Under 20 words
- Grounded in the clinical guidelines provided
- Never say 'talk to your doctor' — name the specific action
- Each section must include:
  * One clinical/medical action
  * One insurance/financial action  
  * One family/communication action
- Each action must have a regretQuote: one sentence 
  describing what happens if this is NOT done, written 
  as a caregiver looking back

Output JSON only:
{
  "tonight": [
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" }
  ],
  "tomorrow": [
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" }
  ],
  "next48": [
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" },
    { "text": "string", "regretQuote": "string" }
  ]
}
Temperature: 0.4. Max tokens: 1500.`;

    let planData;
    try {
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = chatResponse.choices[0]?.message?.content;
      if (!content) throw new Error('No content from GPT-4o');

      planData = JSON.parse(content);
    } catch (gptError) {
      console.error('GPT-4o error:', gptError);
      return NextResponse.json({ error: 'Internal server error from GPT-4o' }, { status: 500 });
    }

    // Store completed plan to Appwrite
    if (sessionId) {
      try {
        const client = new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT!)
          .setProject(process.env.APPWRITE_PROJECT_ID!)
          .setKey(process.env.APPWRITE_API_KEY!);
        const databases = new Databases(client);

        await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          '69eddc5c003dc0e0a3f1', // artifacts collection
          ID.unique(),
          {
            sessionId,
            type: 'plan',
            content: JSON.stringify(planData),
            timestamp: new Date().toISOString()
          }
        );
      } catch (appwriteError) {
        console.error('Appwrite error:', appwriteError);
        // Non-fatal error
      }
    }

    return NextResponse.json(planData, { status: 200 });
  } catch (error) {
    console.error('Plan route error:', error);
    return NextResponse.json({ error: 'Bad request or processing error' }, { status: 400 });
  }
}
