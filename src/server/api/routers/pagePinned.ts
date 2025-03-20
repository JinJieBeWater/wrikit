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
    });

    const pagePromises = pagesPinned.map(async (page) => {
      const result = await ctx.db.query.pages.findFirst({
        where(fields, operators) {
          return operators.and(operators.eq(fields.id, page.pageId));
        },
        columns: {
          parentId: true,
          name: true,
          type: true,
          icon: true,
        },
        orderBy: (pages, { asc }) => [asc(pages.order)],
      });
      if (!result) {
        console.error("找不到页面", page.pageId);
        return;
      }
      return {
        parentId: result.parentId,
        id: page.pageId,
        name: result.name,
        type: result.type,
        icon: result.icon,
        pinnedOrder: page.order,
      };
    });

    const result = await Promise.all(pagePromises);
    return result.filter((item) => item !== undefined);
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
