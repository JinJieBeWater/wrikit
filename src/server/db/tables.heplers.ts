import { pgTableCreator } from "drizzle-orm/pg-core"

export const createTable = pgTableCreator((name) => `wrikit_${name}`)
