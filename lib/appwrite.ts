import { Client, Account, Databases, ID, Query } from "appwrite"

export { ID, Query }

export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

export const COLLECTIONS = {
  fears: "69eddc5700127a860597",
  profiles: process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
  journal: process.env.NEXT_PUBLIC_APPWRITE_JOURNAL_COLLECTION_ID!,
}

// Lazy singletons — created on first call, client-side only.
// Never called during SSR because all usages are inside useEffect.
let _client: Client | null = null
let _account: Account | null = null
let _databases: Databases | null = null

function getClient(): Client {
  if (!_client) {
    _client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  }
  return _client
}

export function getAccount(): Account {
  if (!_account) _account = new Account(getClient())
  return _account
}

export function getDatabases(): Databases {
  if (!_databases) _databases = new Databases(getClient())
  return _databases
}
