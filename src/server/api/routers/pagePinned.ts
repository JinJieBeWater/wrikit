import { Page } from "@/types/page";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { pagesPinned } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export type PageWithPinned = Page & {
  pinnedOrder: number;
};

export const pagePinnedRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const pinnedPagesResult: PageWithPinned[] = [];
    const pagesPinned = await ctx.db.query.pagesPinned.findMany({
      where(fields, operators) {
        return operators.and(operators.eq(fields.userId, ctx.session.user.id));
      },
    });

    for (const page of pagesPinned) {
      const pageResult = await ctx.db.query.pages.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, page.pageId),
            operators.eq(fields.isDeleted, false),
          );
        },
      });

      if (pageResult) {
        pinnedPagesResult.push({
          ...pageResult,
          pinnedOrder: page.order,
        });
      }
    }

    return pinnedPagesResult;
  }),

  create: protectedProcedure
    .input(
      z.object({
        pageId: z.number().describe("页面id"),
        order: z.number().default(0).describe("排序顺序 0为默认"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pagesPinned)
        .values({
          userId: ctx.session.user.id,
          pageId: input.pageId,
          order: input.order,
        })
        .returning();
    }),

  delete: protectedProcedure
    .input(
      z.object({
        pageId: z.number().describe("页面id"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pagesPinned)
        .where(eq(pagesPinned.pageId, input.pageId));
    }),
});
