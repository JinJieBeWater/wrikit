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
    const post = await ctx.db.query.posts.findMany({
      where(fields, operators) {
        return operators.eq(fields.createdById, ctx.session.user.id);
      },
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
    return post ?? null;
  }),
});
