import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(queryClient, { schema });

// Export schema and types
export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";


