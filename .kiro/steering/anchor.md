# Anchor Steering File

## What It Is
Real-time AI companion for cancer caregivers in the first 72 hours after diagnosis.
Competition: Handshake x OpenAI Codex Creator Challenge. Deadline: April 30, 2026.

## Stack
Next.js 15 App Router + OpenAI Realtime API + Pinecone + LlamaParse + Appwrite + Vercel
Appwrite Project: 69cc74de0025c73656de | DB: 69cc78030009929d9719
OpenAI: gpt-4o (Night Note/plan/fear extraction), gpt-4o-realtime-preview (voice)
Pinecone: index=anchor, namespaces=patient-docs/guidelines/wisdom
Deployed: anchor.vercel.app (target)

## Collections to Build
sessions, fears, artifacts

## fears collection schema
sessionId (string), timestamp (datetime), fearSummary (string), fearQuote (string), contextTag (string)

## Key Patterns (non-negotiable)
- All Appwrite writes: wrap in try/catch, localStorage fallback on failure
- Pinecone upsert format: { records: [...] } NOT raw array
- NEXT_PUBLIC_ prefix unreliable server-side: always add non-prefixed duplicate
- Vercel crons send GET: all cron targets must handle GET requests

## The 5 Screens
1. Entry: "Who are you trying hardest not to scare right now?"
2. Listening: voice rant + optional photo upload
3. Night Note: mirrored fear + 3 actions + Anchor Tone audio
4. Plan: 72-hour timeline + artifacts
5. Rehearsal: AI plays oncologist, Fear Timeline shown

## API Routes to Build
- /api/mirror — transcript + pathology text → Night Note JSON
- /api/fear — transcript → extract fear → store to Appwrite
- /api/plan — fear + cancer type + pathology → 72-hour plan with regret quotes
- /api/ingest — PDF → LlamaParse → chunk → embed → Pinecone patient-docs namespace

## Cancer Types Supported
Colon, breast, lung ONLY.

## Design Rules
- Background: #111827
- Primary accent: #FF8A65 (coral)
- Secondary: #C4B5FD (lavender)
- Text: #F9FAFB
- Font: Inter, sentence case always
- Single column always. One primary action per screen. Mobile-first.
- Motion: 220-320ms ease-out. No bounce, no elastic.

## What NOT to Build
- Native iOS/Android app (PWA only)
- Insurance live lookup (simulate it)
- MyChart integration (simulate it)
- More than 3 cancer types
- Push notifications beyond morning nudge
- Unit tests unless explicitly requested

## Kiro Usage Rules (500 credit budget)
- Use Kiro ONLY for: spec generation, requirements/design/tasks.md, structural decisions
- Use Kiro terminal for ALL commands (free, no credits)
- Use Claude Code (free) for: all API route implementation, debugging, wiring
- Use Codex ($100 credit) for: all UI components, artifact remix, entry screen
- Never ask Kiro to implement more than 1 task at a time
- Always read steering file before starting any Kiro agent task
- Preferred Kiro model: DeepSeek 3.2 (0.25x credit cost) for simple tasks
- Preferred Kiro model: Auto for spec generation only
- Never ask Kiro to generate tests
- Never ask Kiro to explain code it just wrote — read it yourself
- If a task can be done in terminal, do it in terminal (free)
- If a task can be done by Claude Code, do it there (free)
- Kiro agent tasks should be max 1-2 files per session to minimize token use