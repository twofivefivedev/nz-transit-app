import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "@metlink/db";

export interface TRPCContext {
  db: typeof db;
}

export function createTRPCContext(): TRPCContext {
  return { db };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;








