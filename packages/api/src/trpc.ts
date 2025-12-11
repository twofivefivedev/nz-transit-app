import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export interface TRPCContext {
  // Add user session, database client, etc. here
}

export function createTRPCContext(): TRPCContext {
  return {};
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;








