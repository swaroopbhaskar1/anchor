# Requirements Document

## Introduction

Anchor is a real-time AI companion for cancer caregivers in the first 72 hours after diagnosis. This document specifies the requirements for the four core API routes that power Anchor's backend: `/api/mirror`, `/api/fear`, `/api/plan`, and `/api/ingest`. These routes handle AI-driven emotional mirroring, fear extraction and persistence, 72-hour action plan generation, and pathology document ingestion into a vector store. All routes are implemented as Next.js 15 App Router route handlers deployed on Vercel.

## Glossary

- **Mirror_Route**: The `/api/mirror` POST handler that generates a Night Note JSON response.
- **Fear_Route**: The `/api/fear` POST handler that extracts and persists a caregiver's core fear.
- **Plan_Route**: The `/api/plan` POST handler that generates a 72-hour caregiver action plan.
- **Ingest_Route**: The `/api/ingest` POST handler that processes a PDF pathology report into Pinecone.
- **Night_Note**: A structured JSON object containing an empathetic mirror statement, grounding statement, three concrete actions, a fear summary, and a fear quote.
- **Transcript**: A string containing the caregiver's spoken or typed rant captured during the Listening screen.
- **Pathology_Text**: A string containing extracted text from the patient's pathology report.
- **Cancer_Type**: One of exactly three string literals: `"colon"`, `"breast"`, or `"lung"`.
- **Task**: An object with a required `text` field (string) and an optional `regretQuote` field (string).
- **Fear_Record**: A document stored in the Appwrite `fears` collection with fields: `sessionId`, `timestamp`, `fearSummary`, `fearQuote`, `contextTag`.
- **GPT4o**: The OpenAI `gpt-4o` model used for all text generation in these routes.
- **LlamaParse**: The external PDF parsing service used to extract text from uploaded pathology PDFs.
- **Pinecone**: The vector database used to store embedded document chunks, with index `anchor` and namespace `patient-docs`.
- **Appwrite**: The backend-as-a-service used for persisting Fear_Records, with project ID `69cc74de0025c73656de` and database ID `69cc78030009929d9719`.
- **OpenAI_Embeddings**: The OpenAI embeddings API used to produce vector representations of text chunks before Pinecone upsert.
- **LocalStorage_Fallback**: A client-accessible fallback mechanism that stores data in the browser's `localStorage` when an Appwrite write fails.
- **Session_ID**: A string identifier that groups a caregiver's session data across routes.
- **Context_Tag**: A string label categorizing the emotional or situational context of a fear extraction (e.g., `"diagnosis"`, `"treatment"`, `"family"`).
- **Regret_Quote**: An optional string within a Task that contains a real-sounding first-person quote from someone who wished they had completed that task sooner.

---

## Requirements

### Requirement 1: Mirror Route — Night Note Generation

**User Story:** As a caregiver who has just received a cancer diagnosis for someone I love, I want the app to reflect my fear back to me with empathy and give me three concrete things I can do tonight, so that I feel seen and not paralyzed.

#### Acceptance Criteria

1. THE Mirror_Route SHALL accept POST requests with a JSON body containing `transcript` (string), `pathologyText` (string), and `cancerType` (one of `"colon"`, `"breast"`, `"lung"`).
2. WHEN a valid POST request is received, THE Mirror_Route SHALL call GPT4o with a prompt that instructs it to generate a Night_Note grounded in the provided transcript and pathologyText.
3. WHEN GPT4o returns a response, THE Mirror_Route SHALL parse the response into a JSON object with exactly the fields: `mirror` (string), `ground` (string), `actions` (array of exactly 3 strings), `fearSummary` (string), and `fearQuote` (string).
4. THE Mirror_Route SHALL return the Night_Note JSON with HTTP status 200 on success.
5. WHEN the `cancerType` field is not one of `"colon"`, `"breast"`, or `"lung"`, THE Mirror_Route SHALL return HTTP status 400 with a descriptive error message.
6. WHEN the `transcript` field is absent or empty, THE Mirror_Route SHALL return HTTP status 400 with a descriptive error message.
7. WHEN GPT4o returns a response that cannot be parsed into the required Night_Note shape, THE Mirror_Route SHALL return HTTP status 500 with a descriptive error message.
8. THE Mirror_Route SHALL instruct GPT4o to produce the `mirror` field as an empathetic restatement of the caregiver's fear in second person, not a clinical summary.
9. THE Mirror_Route SHALL instruct GPT4o to produce the `fearQuote` field as a direct verbatim excerpt from the provided `transcript`.
10. THE Mirror_Route SHALL instruct GPT4o to produce the `actions` array as exactly 3 concrete, actionable tasks appropriate for the caregiver to complete within the next few hours.

---

### Requirement 2: Fear Route — Fear Extraction and Persistence

**User Story:** As a caregiver, I want my core fear to be identified and saved from what I said, so that the app can reference it throughout my experience and I don't have to repeat myself.

#### Acceptance Criteria

1. THE Fear_Route SHALL accept POST requests with a JSON body containing `transcript` (string), `sessionId` (string), and `contextTag` (string).
2. WHEN a valid POST request is received, THE Fear_Route SHALL call GPT4o with a prompt that instructs it to extract the single most prominent fear from the transcript.
3. WHEN GPT4o returns a response, THE Fear_Route SHALL parse it into an object with exactly the fields: `fearSummary` (string) and `fearQuote` (string).
4. THE Fear_Route SHALL return a JSON response with fields `fearSummary`, `fearQuote`, and `contextTag` (echoed from the request) with HTTP status 200 on success.
5. WHEN the `transcript` field is absent or empty, THE Fear_Route SHALL return HTTP status 400 with a descriptive error message.
6. WHEN the `sessionId` field is absent or empty, THE Fear_Route SHALL return HTTP status 400 with a descriptive error message.
7. AFTER extracting the fear, THE Fear_Route SHALL attempt to write a Fear_Record to the Appwrite `fears` collection with fields: `sessionId`, `timestamp` (current UTC datetime), `fearSummary`, `fearQuote`, and `contextTag`.
8. THE Fear_Route SHALL wrap the Appwrite write operation in a try/catch block.
9. IF the Appwrite write fails, THEN THE Fear_Route SHALL include a `localStorageFallback` field in the response JSON containing the Fear_Record data, so the client can persist it to localStorage.
10. IF the Appwrite write fails, THEN THE Fear_Route SHALL still return HTTP status 200 with the extracted fear data and the `localStorageFallback` payload — it SHALL NOT return an error status solely due to a persistence failure.
11. THE Fear_Route SHALL instruct GPT4o to produce the `fearQuote` field as a direct verbatim excerpt from the provided `transcript`.

---

### Requirement 3: Plan Route — 72-Hour Action Plan Generation

**User Story:** As a caregiver, I want a concrete 72-hour plan tailored to my loved one's cancer type and my specific fear, so that I know exactly what to do and don't waste time on the wrong things.

#### Acceptance Criteria

1. THE Plan_Route SHALL accept POST requests with a JSON body containing `fearSummary` (string), `cancerType` (one of `"colon"`, `"breast"`, `"lung"`), and `pathologyText` (string).
2. WHEN a valid POST request is received, THE Plan_Route SHALL call GPT4o with a prompt that instructs it to generate a 72-hour action plan grounded in the provided `fearSummary`, `cancerType`, and `pathologyText`.
3. WHEN GPT4o returns a response, THE Plan_Route SHALL parse it into a JSON object with exactly the fields: `tonight` (array of Task), `tomorrow` (array of Task), and `next48` (array of Task).
4. THE Plan_Route SHALL return the plan JSON with HTTP status 200 on success.
5. WHEN the `cancerType` field is not one of `"colon"`, `"breast"`, or `"lung"`, THE Plan_Route SHALL return HTTP status 400 with a descriptive error message.
6. WHEN the `fearSummary` field is absent or empty, THE Plan_Route SHALL return HTTP status 400 with a descriptive error message.
7. WHEN GPT4o returns a response that cannot be parsed into the required plan shape, THE Plan_Route SHALL return HTTP status 500 with a descriptive error message.
8. THE Plan_Route SHALL instruct GPT4o that each Task in the plan MAY include an optional `regretQuote` field containing a real-sounding first-person quote from someone who wished they had completed that task sooner.
9. THE Plan_Route SHALL instruct GPT4o to produce tasks that are specific to the provided `cancerType` and grounded in the clinical context of the `pathologyText`.
10. THE Plan_Route SHALL instruct GPT4o to produce at least one Task in each of the three time buckets: `tonight`, `tomorrow`, and `next48`.

---

### Requirement 4: Ingest Route — Pathology PDF Ingestion

**User Story:** As a caregiver, I want to upload my loved one's pathology report so that the app can reference the actual medical details when giving me guidance, rather than speaking in generalities.

#### Acceptance Criteria

1. THE Ingest_Route SHALL accept POST requests with `multipart/form-data` containing a PDF file field.
2. WHEN a valid POST request is received, THE Ingest_Route SHALL forward the PDF to LlamaParse and retrieve the extracted plain text.
3. WHEN LlamaParse returns the extracted text, THE Ingest_Route SHALL split the text into chunks suitable for embedding.
4. WHEN chunks are produced, THE Ingest_Route SHALL call the OpenAI_Embeddings API to produce a vector for each chunk.
5. WHEN embeddings are produced, THE Ingest_Route SHALL upsert all chunk vectors to Pinecone using the index `anchor` and namespace `patient-docs`.
6. THE Ingest_Route SHALL format the Pinecone upsert payload as `{ records: [...] }` — NOT as a raw array.
7. THE Ingest_Route SHALL return a JSON response with fields `success` (boolean), `chunkCount` (number of chunks upserted), and `sessionId` (string) with HTTP status 200 on success.
8. WHEN the request does not contain a PDF file, THE Ingest_Route SHALL return HTTP status 400 with a descriptive error message.
9. WHEN LlamaParse returns an error or empty text, THE Ingest_Route SHALL return HTTP status 422 with a descriptive error message.
10. WHEN the Pinecone upsert fails, THE Ingest_Route SHALL return HTTP status 500 with a descriptive error message.
11. THE Ingest_Route SHALL generate or accept a `sessionId` to associate the ingested chunks with a caregiver session, and include it in the Pinecone record metadata for each chunk.

---

### Requirement 5: Environment Variable Access

**User Story:** As a developer deploying Anchor on Vercel, I want all server-side API routes to reliably access environment variables regardless of prefix conventions, so that no route silently fails due to a missing key.

#### Acceptance Criteria

1. THE Mirror_Route, Fear_Route, Plan_Route, and Ingest_Route SHALL each access the OpenAI API key using a non-`NEXT_PUBLIC_`-prefixed environment variable name (e.g., `OPENAI_API_KEY`).
2. THE Fear_Route SHALL access Appwrite credentials using non-`NEXT_PUBLIC_`-prefixed environment variable names.
3. THE Ingest_Route SHALL access Pinecone and LlamaParse credentials using non-`NEXT_PUBLIC_`-prefixed environment variable names.
4. WHERE a `NEXT_PUBLIC_`-prefixed variable is defined in the environment, THE corresponding route SHALL also define and use a non-prefixed duplicate of that variable for server-side access.

---

### Requirement 6: Shared Error Response Shape

**User Story:** As a frontend developer consuming these routes, I want all error responses to follow a consistent shape, so that I can handle them uniformly without per-route special cases.

#### Acceptance Criteria

1. THE Mirror_Route, Fear_Route, Plan_Route, and Ingest_Route SHALL each return error responses as JSON objects with at minimum an `error` field (string) describing the failure.
2. WHEN an unhandled exception occurs in any route, THE route SHALL return HTTP status 500 with a JSON body containing an `error` field.
3. THE Mirror_Route, Fear_Route, Plan_Route, and Ingest_Route SHALL NOT expose raw stack traces or internal error objects in the response body.
