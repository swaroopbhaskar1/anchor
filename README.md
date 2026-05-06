# Anchor

Anchor is a Next.js application for cancer caregivers who need a private place to say the unfiltered thing, get the fear reflected back, and leave with clinically grounded next steps.

The product centers on a short voice-first loop: a caregiver speaks what they are carrying, Anchor captures the transcript through OpenAI Realtime WebRTC, retrieves cancer-specific guideline and caregiver-wisdom context from Pinecone, and returns a structured note with emotional mirroring, one clinical grounding point, and three concrete actions.

Anchor is not emergency care, diagnosis, or a replacement for an oncology team. It is designed for orientation, preparation, and caregiver support.

## Core Loop

1. The caregiver signs in with Appwrite magic link or continues as a guest.
2. Onboarding collects the caregiver name, relationship to the person diagnosed, and cancer type.
3. The caregiver optionally uploads a pathology PDF or pastes pathology context.
4. The caregiver starts a voice session, speaks freely, then stops recording.
5. The accumulated transcript is sent to `/api/mirror`.
6. Anchor returns:
   - `mirror`: a human reflection of the underlying fear.
   - `ground`: a concise clinical fact grounded in retrieved context.
   - `actions`: three specific next steps.
   - `fearSummary`: the dominant fear in short form.
   - `fearQuote`: the raw phrase from the transcript.
7. The caregiver can request a 72-hour plan from `/api/plan`, copy a note, copy a handoff text, speak again, or use one of the companion tools.

## Features

- Voice capture through the OpenAI Realtime API over WebRTC.
- Whisper transcription through Realtime `input_audio_transcription`.
- Caregiver onboarding for name, relationship, and cancer type.
- Supported cancer types: `colon`, `breast`, and `lymphoma`.
- Appwrite magic-link and six-digit email-token sign-in, plus guest mode.
- Local fallback persistence for guest profile, fear timeline, journal entries, and one-thing completion count.
- Appwrite persistence for authenticated profiles, journal entries, fear memories, and generated plans.
- Pathology PDF ingestion with LlamaParse, OpenAI embeddings, and Pinecone upsert.
- Optional pasted pathology context that is passed directly into mirror and plan generation.
- RAG over `guidelines` and `wisdom` Pinecone namespaces.
- 72-hour action plans with regret-prevention prompts.
- Fear timeline from local storage or Appwrite.
- Private companion tools:
  - `Calm Down`: paced breathing.
  - `Clear My Head`: typed thought reflection through `/api/mirror`.
  - `Get It Out`: private journaling with keep/release flows.
  - `Just Do This`: one small caregiver task.
- Clipboard export for a full Anchor note and a concise support-person handoff.
- Built-in demo mode with example colon-cancer output.
- shadcn/ui component library, Tailwind CSS, Framer Motion, Sonner toasts, and Vercel Analytics.

## Clinical Grounding Architecture

Anchor uses a retrieval-augmented architecture for clinical grounding.

`data/guidelines-chunks.json` contains curated clinical chunks for colon cancer, breast cancer, and lymphoma. The chunk metadata includes `cancerType`, `topic`, and `source`, with source labels such as NCCN guideline versions and oncology literature references.

`scripts/upsert-guidelines.ts` embeds those chunks with `text-embedding-3-small` and writes them to the Pinecone `guidelines` namespace.

`scripts/seed-wisdom.ts` embeds caregiver-support and navigation guidance into the Pinecone `wisdom` namespace. Wisdom records are tagged as either `universal` or cancer-type-specific.

`/api/mirror` and `/api/plan` embed a query, retrieve from:

- `guidelines`: top 5 matches filtered to the selected `cancerType`.
- `wisdom`: top 3 matches filtered to the selected `cancerType` or `universal`.

Those retrieved texts are injected into tightly constrained GPT-4o system prompts that require JSON output and specific section shapes.

`/api/ingest` parses uploaded pathology PDFs with LlamaParse, chunks the parsed text, embeds it, and upserts it into Pinecone. Current generation routes use pasted `pathologyText` directly and retrieve from `guidelines` and `wisdom`; the uploaded `patient-docs` namespace is present as ingestion infrastructure for report retrieval.

## API Reference

All API routes are Next.js route handlers under `app/api`.

### `POST /api/session`

Creates an OpenAI Realtime ephemeral session for browser WebRTC.

Request body: none.

OpenAI session configuration:

- `model`: `gpt-4o-realtime-preview-2024-12-17`
- `voice`: `alloy`
- `modalities`: `["audio", "text"]`
- `tool_choice`: `auto`

Success response:

```json
{
  "id": "sess_...",
  "object": "realtime.session",
  "client_secret": {
    "value": "ek_..."
  }
}
```

The exact payload is proxied from OpenAI. The WebRTC hook reads `client_secret.value`.

Error response:

```json
{
  "error": "Failed to fetch session data"
}
```

### `POST /api/mirror`

Generates the main Anchor reflection.

Request body:

```json
{
  "transcript": "I do not know what questions to ask and I am scared I will miss something.",
  "pathologyText": "Optional pasted stage, biomarkers, impression, or confusing report line.",
  "cancerType": "colon"
}
```

Validation:

- `transcript` is required.
- `cancerType` must be `colon`, `breast`, or `lymphoma`.

Success response:

```json
{
  "mirror": "string",
  "ground": "string",
  "actions": ["string", "string", "string"],
  "fearSummary": "string",
  "fearQuote": "string"
}
```

Error responses:

```json
{ "error": "transcript is required" }
```

```json
{ "error": "cancerType must be one of: colon | breast | lymphoma" }
```

```json
{ "error": "Internal server error from GPT-4o" }
```

```json
{ "error": "Bad request or processing error" }
```

### `POST /api/plan`

Generates a 72-hour action plan and optionally persists it to Appwrite.

Request body:

```json
{
  "fearSummary": "terrified of missing a test that could hurt her",
  "cancerType": "breast",
  "pathologyText": "Optional pasted pathology context.",
  "sessionId": "session-1710000000000"
}
```

Validation:

- `cancerType` must be `colon`, `breast`, or `lymphoma`.
- `sessionId` is optional. When present, the completed plan is written to the Appwrite artifacts collection.

Success response:

```json
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
```

Error responses:

```json
{ "error": "cancerType must be one of: colon | breast | lymphoma" }
```

```json
{ "error": "Internal server error from GPT-4o" }
```

```json
{ "error": "Bad request or processing error" }
```

### `POST /api/fear`

Extracts a fear memory from a transcript and attempts to persist it to Appwrite. Appwrite write failures are logged but do not block the response.

Request body:

```json
{
  "transcript": "I keep thinking the scan will show it spread everywhere.",
  "sessionId": "session-1710000000000",
  "contextTag": "scan",
  "userId": "optional-appwrite-user-id"
}
```

Validation:

- `transcript` is required and must be a non-empty string.
- `sessionId` is required and must be a non-empty string.
- `contextTag` must be one of `diagnosis`, `scan`, `chemo_start`, `post_surgery`, `night-note`, or `other`.
- `userId` is optional.

Success response:

```json
{
  "fearSummary": "string",
  "fearQuote": "string",
  "contextTag": "scan"
}
```

Error responses:

```json
{ "error": "Invalid JSON body" }
```

```json
{ "error": "transcript is required and must be a non-empty string" }
```

```json
{ "error": "sessionId is required and must be a non-empty string" }
```

```json
{ "error": "contextTag must be one of: diagnosis, scan, chemo_start, post_surgery, night-note, other" }
```

```json
{ "error": "Server misconfiguration: missing OPENAI_API_KEY" }
```

```json
{ "error": "GPT-4o returned an unparseable response" }
```

```json
{ "error": "GPT-4o response was missing required fields" }
```

### `POST /api/ingest`

Parses a pathology PDF and stores embedded chunks in Pinecone.

Request body: `multipart/form-data`.

Fields:

- `file`: PDF file.
- `sessionId`: string.
- `cancerType`: `colon`, `breast`, or `lymphoma`.

Behavior:

- Uploads the PDF to LlamaParse.
- Polls for parsed markdown.
- Chunks the text into roughly 500-word chunks with overlap.
- Embeds chunks with `text-embedding-3-small`.
- Upserts records into Pinecone.
- Uses the `patient-docs` namespace by default.
- Uses the `guidelines` namespace when `sessionId` starts with `nccn-`.

Success response:

```json
{
  "success": true,
  "sessionId": "session-1710000000000",
  "chunksIngested": 12
}
```

Error responses:

```json
{ "error": "file, sessionId, and cancerType are required" }
```

```json
{ "error": "cancerType must be colon | breast | lymphoma" }
```

```json
{ "error": "LlamaParse upload failed" }
```

```json
{ "error": "LlamaParse did not return text in time" }
```

```json
{ "error": "No text could be extracted or chunked from the file" }
```

```json
{ "error": "Internal server error" }
```

## Data Stores

### Pinecone

Expected namespaces:

- `guidelines`: clinical guideline chunks from `data/guidelines-chunks.json`.
- `wisdom`: caregiver navigation and psycho-oncology support snippets from `scripts/seed-wisdom.ts`.
- `patient-docs`: uploaded pathology-report chunks from `/api/ingest`.

The index must support OpenAI `text-embedding-3-small` vectors.

### Appwrite

The browser client uses `NEXT_PUBLIC_APPWRITE_*` variables for account, profile, and journal access. Server routes use admin `APPWRITE_*` variables for fear and artifact writes.

Collections referenced by the application:

- `fears`: hardcoded collection id `69eddc5700127a860597`.
  - `sessionId`, `timestamp`, `fearSummary`, `fearQuote`, `contextTag`, optional `userId`.
- `artifacts`: hardcoded collection id `69eddc5c003dc0e0a3f1`.
  - `sessionId`, `type`, `content`, `timestamp`.
- `profiles`: configured by `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID`.
  - document id is the Appwrite user id.
  - `userId`, `name`, `relationship`, `cancerType`.
- `journal`: configured by `NEXT_PUBLIC_APPWRITE_JOURNAL_COLLECTION_ID`.
  - `userId`, `content`, `prompt`, `timestamp`, `kept`.

`scripts/setup-appwrite.ts` creates `fears`, `sessions`, and `artifacts` collections in an existing Appwrite database. Profiles and journal collections are expected by the current UI and should be created/configured separately if they are not already present.

## Local Development

Requirements:

- Node.js 20 or newer.
- npm.
- OpenAI API key.
- Pinecone project and index.
- Llama Cloud API key for PDF ingestion.
- Appwrite project/database for auth and persistence.

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`, then start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build
```

## Seeding Clinical Context

Seed the guideline namespace:

```bash
npx tsx scripts/upsert-guidelines.ts
```

Seed the caregiver-wisdom namespace:

```bash
npx tsx scripts/seed-wisdom.ts
```

Check Pinecone index stats:

```bash
npx tsx scripts/check-pinecone.ts
```

Set up the Appwrite collections handled by the setup script:

```bash
npx tsx scripts/setup-appwrite.ts
```

## Project Structure

```text
app/
  api/
    fear/route.ts      Fear extraction and persistence
    ingest/route.ts    Pathology PDF parsing and vector upsert
    mirror/route.ts    Main grounded reflection endpoint
    plan/route.ts      72-hour plan generation
    session/route.ts   OpenAI Realtime ephemeral sessions
  layout.tsx           Providers, metadata, analytics
  page.tsx             Main Anchor experience
components/
  ui/                  shadcn/ui primitives
  translations-context.tsx
hooks/
  use-webrtc.ts        OpenAI Realtime WebRTC session manager
  use-tools.ts         Legacy starter tool-call handlers
lib/
  appwrite.ts          Browser Appwrite client
  tools.ts             Realtime tool definitions
  conversations.ts     Conversation message type
  translations/        Starter i18n dictionaries
scripts/
  setup-appwrite.ts
  seed-wisdom.ts
  upsert-guidelines.ts
  check-pinecone.ts
data/
  guidelines-chunks.json
```

## Notes For Contributors

- The current primary app is `app/page.tsx`; several inherited Realtime starter components remain in `components/` for reference/debug surfaces.
- Realtime tool definitions are passed into the WebRTC session, but the main Anchor experience does not currently register the corresponding client functions from `hooks/use-tools.ts`.
- Uploaded pathology PDFs are embedded into Pinecone. Mirror and plan generation currently use pasted pathology text plus guideline/wisdom retrieval.
- API prompts require JSON output. When changing prompt shape, update this README and the corresponding TypeScript interfaces in `app/page.tsx`.
- Keep clinical claims tied to retrieved context or explicit source chunks. Avoid adding ungrounded medical guidance directly in UI copy.

## License

MIT. See `LICENSE`.
