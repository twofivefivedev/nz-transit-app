import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@metlink/api";

export const trpc = createTRPCReact<AppRouter>();





