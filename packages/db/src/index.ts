import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })

export * from './schema'
export { eq, and, or, ne, gt, gte, lt, lte, isNull, isNotNull, sql, asc, desc, inArray } from 'drizzle-orm'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
