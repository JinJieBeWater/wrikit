import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages } from "@/server/db/schema/pages";
import { createPageZod } from "@/zod/page";

export const pageRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ description: "创建新页面" })
    .input(createPageZod)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(pages).values({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getRootPage: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.pages.findMany({
      where(fields, operators) {
        // 为当前用户创建且没有parentId的页面
        return operators.and(
          operators.eq(fields.createdById, ctx.session.user.id),
          operators.isNull(fields.parentId),
        );
      },
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
    return post ?? null;
  }),
});
