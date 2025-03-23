import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { pagesPinned } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const pagePinnedRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const pagesPinned = await ctx.db.query.pagesPinned.findMany({
      where(fields, operators) {
        return operators.and(operators.eq(fields.userId, ctx.session.user.id));
      },
      with: {
        page: {
          columns: {
            parentId: true,
            name: true,
            type: true,
            icon: true,
            isDeleted: true,
            id: true,
          },
        },
      },
    });

    const result = pagesPinned.map((page) => {
      const { page: pageData, pageId, userId, ...rest } = page;
      return {
        ...rest,
        ...pageData,
      };
    });

    return result;
  }),

  create: protectedProcedure
    .input(
      z.object({
        pageId: z.string().describe("页面id"),
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
        pageId: z.string().describe("页面id"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pagesPinned)
        .where(eq(pagesPinned.pageId, input.pageId));
    }),
});
