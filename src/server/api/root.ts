import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { bugRouter } from "~/server/api/routers/bug";

export const appRouter = createTRPCRouter({
  bug: bugRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);