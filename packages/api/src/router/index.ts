import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.context().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Example router - will be expanded later
export const appRouter = router({});

export type AppRouter = typeof appRouter;


