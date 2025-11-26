import { router } from "../trpc";
import { stopsRouter } from "./stops";
import { departuresRouter } from "./departures";

export const appRouter = router({
  stops: stopsRouter,
  departures: departuresRouter,
});

export type AppRouter = typeof appRouter;





