/**
 * scripts/setup-appwrite.ts
 *
 * Programmatically creates the "fears", "sessions", and "artifacts"
 * collections (with typed attributes) in an existing Appwrite database.
 *
 * Run:  npx tsx scripts/setup-appwrite.ts
 *
 * Required env vars (read from .env.local automatically by tsx/dotenv):
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *   APPWRITE_DATABASE_ID
 */

import { Client, Databases, ID } from "node-appwrite";
import * as dotenv from "dotenv";
import path from "path";

// ── Load .env.local ────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
} = process.env;

if (
  !APPWRITE_ENDPOINT ||
  !APPWRITE_PROJECT_ID ||
  !APPWRITE_API_KEY ||
  !APPWRITE_DATABASE_ID
) {
  console.error(
    "❌  Missing one or more required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID"
  );
  process.exit(1);
}

// ── Appwrite client ────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = APPWRITE_DATABASE_ID;

// ── Helper: pause between attribute creation (Appwrite rate limits) ─
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Collection definitions ─────────────────────────────────────────
interface AttributeDef {
  key: string;
  type: "string" | "datetime";
  required: boolean;
  size?: number; // only for string attributes
}

interface CollectionDef {
  name: string;
  attributes: AttributeDef[];
}

const collections: CollectionDef[] = [
  {
    name: "fears",
    attributes: [
      { key: "sessionId", type: "string", required: true, size: 255 },
      { key: "timestamp", type: "datetime", required: true },
      { key: "fearSummary", type: "string", required: true, size: 1024 },
      { key: "fearQuote", type: "string", required: true, size: 2048 },
      { key: "contextTag", type: "string", required: true, size: 255 },
    ],
  },
  {
    name: "sessions",
    attributes: [
      { key: "sessionId", type: "string", required: true, size: 255 },
      { key: "cancerType", type: "string", required: true, size: 255 },
      { key: "timestamp", type: "datetime", required: true },
      { key: "pathFingerprint", type: "string", required: false, size: 512 },
    ],
  },
  {
    name: "artifacts",
    attributes: [
      { key: "sessionId", type: "string", required: true, size: 255 },
      { key: "type", type: "string", required: true, size: 255 },
      { key: "content", type: "string", required: true, size: 65535 },
      { key: "timestamp", type: "datetime", required: true },
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("🚀  Appwrite collection setup starting…");
  console.log(`   Endpoint : ${APPWRITE_ENDPOINT}`);
  console.log(`   Project  : ${APPWRITE_PROJECT_ID}`);
  console.log(`   Database : ${DATABASE_ID}\n`);

  for (const col of collections) {
    // ── Create collection ──────────────────────────────────────────
    try {
      const created = await databases.createCollection(
        DATABASE_ID,
        ID.unique(),
        col.name
      );
      console.log(
        `✅  Collection "${col.name}" created  (id: ${created.$id})`
      );

      // ── Create attributes ────────────────────────────────────────
      for (const attr of col.attributes) {
        try {
          if (attr.type === "string") {
            await databases.createStringAttribute(
              DATABASE_ID,
              created.$id,
              attr.key,
              attr.size ?? 255,
              attr.required
            );
          } else if (attr.type === "datetime") {
            await databases.createDatetimeAttribute(
              DATABASE_ID,
              created.$id,
              attr.key,
              attr.required
            );
          }
          console.log(`   ✅  Attribute "${attr.key}" (${attr.type}) added`);
        } catch (attrErr: unknown) {
          const msg =
            attrErr instanceof Error ? attrErr.message : String(attrErr);
          console.error(
            `   ❌  Failed to add attribute "${attr.key}" on "${col.name}": ${msg}`
          );
        }

        // Small delay to respect Appwrite rate limits
        await sleep(300);
      }
    } catch (colErr: unknown) {
      const msg = colErr instanceof Error ? colErr.message : String(colErr);
      console.error(`❌  Failed to create collection "${col.name}": ${msg}`);
    }

    console.log(); // blank line between collections
  }

  console.log("🏁  Setup complete.");
}

main();
