# Implementation Plan: Anchor API Routes

## Overview

Four independent Next.js 15 App Router route handlers. Each task covers at most 1-2 files. No tests. Implement sequentially — each route is self-contained.

## Tasks

- [ ] 1. Create `app/api/mirror/route.ts`
  - Define `POST` handler accepting `{ transcript, pathologyText, cancerType }`
  - Validate: 400 if `transcript` missing/empty; 400 if `cancerType` not in `["colon","breast","lung"]`
  - Call OpenAI Chat Completions via raw `fetch` using `OPENAI_API_KEY` (non-`NEXT_PUBLIC_` prefixed)
  - Use `response_format: { type: "json_object" }` and a prompt that produces `{ mirror, ground, actions, fearSummary, fearQuote }`
  - Prompt must instruct: `mirror` in second person, `fearQuote` verbatim from transcript, `actions` exactly 3 strings
  - Parse GPT response → 500 if shape is missing any required field
  - Wrap entire handler in top-level `try/catch` → 500 `{ error: "Internal server error" }` on unhandled exception
  - Return 200 with `NightNote` JSON on success
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 5.1, 6.1, 6.2, 6.3_

- [ ] 2. Create `app/api/fear/route.ts`
  - Define `POST` handler accepting `{ transcript, sessionId, contextTag }`
  - Validate: 400 if `transcript` missing/empty; 400 if `sessionId` missing/empty
  - Call OpenAI Chat Completions via raw `fetch` using `OPENAI_API_KEY`
  - Prompt instructs GPT-4o to extract `{ fearSummary, fearQuote }` — `fearQuote` must be verbatim from transcript
  - Parse GPT response → 500 if shape is missing required fields
  - Instantiate Appwrite `Client` + `Databases` using `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DATABASE_ID`, `APPWRITE_FEARS_COLLECTION_ID`, `APPWRITE_API_KEY` (all non-`NEXT_PUBLIC_` prefixed)
  - Wrap `db.createDocument(...)` in `try/catch`; on failure populate `localStorageFallback` with the full `FearRecord` shape
  - Return 200 with `{ fearSummary, fearQuote, contextTag }` on Appwrite success
  - Return 200 with `{ fearSummary, fearQuote, contextTag, localStorageFallback }` on Appwrite failure — never return error status for persistence failure
  - Wrap entire handler in top-level `try/catch` → 500 on unhandled exception
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 5.1, 5.2, 6.1, 6.2, 6.3_

- [ ] 3. Create `app/api/plan/route.ts`
  - Define `POST` handler accepting `{ fearSummary, cancerType, pathologyText }`
  - Validate: 400 if `fearSummary` missing/empty; 400 if `cancerType` not in `["colon","breast","lung"]`
  - Call OpenAI Chat Completions via raw `fetch` using `OPENAI_API_KEY`
  - Use `response_format: { type: "json_object" }` and a prompt that produces `{ tonight: Task[], tomorrow: Task[], next48: Task[] }`
  - Prompt must instruct: tasks tailored to `cancerType`, grounded in `pathologyText`, at least 1 task per bucket, optional `regretQuote` per task
  - Parse GPT response → 500 if shape is missing any bucket or any bucket is empty
  - Wrap entire handler in top-level `try/catch` → 500 on unhandled exception
  - Return 200 with plan JSON on success
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.1, 6.1, 6.2, 6.3_

- [ ] 4. Create `app/api/ingest/route.ts`
  - Define `POST` handler accepting `multipart/form-data` with a `file` field (PDF)
  - Validate: 400 if no `file` field present in FormData
  - Extract optional `sessionId` from FormData; generate one via `crypto.randomUUID()` if absent
  - Upload PDF to LlamaParse REST API (`POST /api/parsing/job`) using `LLAMA_CLOUD_API_KEY` (non-`NEXT_PUBLIC_` prefixed); poll `GET /api/parsing/job/{jobId}/result/markdown` until complete
  - Return 422 if LlamaParse returns error or empty/whitespace text
  - Chunk extracted text: 800-character window, 100-character overlap
  - Embed all chunks via `POST https://api.openai.com/v1/embeddings` with model `text-embedding-3-small` using `OPENAI_API_KEY`
  - Upsert to Pinecone index `anchor`, namespace `patient-docs` using `PINECONE_API_KEY` (non-`NEXT_PUBLIC_` prefixed)
  - Upsert payload MUST be `{ records: [...] }` — each record: `{ id: "${sessionId}-chunk-${i}", values: embeddings[i], metadata: { sessionId, chunkIndex: i, text } }`
  - Wrap Pinecone upsert in `try/catch` → 500 `{ error: "Pinecone upsert failed" }` on failure
  - Wrap entire handler in top-level `try/catch` → 500 on unhandled exception
  - Return 200 with `{ success: true, chunkCount, sessionId }` on success
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 5.1, 5.3, 6.1, 6.2, 6.3_
