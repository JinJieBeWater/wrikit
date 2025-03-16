import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages } from "@/server/db/schema/pages";
import { PageTree, PageTypeArray } from "@/types/page";
import { z } from "zod";

export const createPageZod = z.object({
  type: z.enum(PageTypeArray).describe("页面类型"),
  name: z.string().describe("页面名称"),
  content: z.string().optional().describe("页面内容"),
  parentId: z.number().optional().describe("父页面id"),
});

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

  getPagetree: protectedProcedure
    .input(
      z.object({
        authorId: z.string().describe("作者id"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rootPages = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.createdById, input.authorId),
            operators.isNull(fields.parentId),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });

      const getPagesByParentId = async (
        parentId: number,
      ): Promise<PageTree[]> => {
        const pages = await ctx.db.query.pages.findMany({
          where(fields, operators) {
            return operators.eq(fields.parentId, parentId);
          },
          orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        });

        const pageTree: PageTree[] = [];
        for (const page of pages) {
          const child = await getPagesByParentId(page.id);
          pageTree.push({
            ...page,
            child,
          });
        }
        return pageTree;
      };

      const pageTree: PageTree[] = [];
      for (const page of rootPages) {
        const child = await getPagesByParentId(page.id);
        pageTree.push({
          ...page,
          child,
        });
      }

      return pageTree;
    }),

  getRootPages: protectedProcedure
    .input(
      z.object({
        authorId: z.string().describe("作者id"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pages = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          // 为当前用户创建且没有parentId的页面
          return operators.and(
            operators.eq(fields.createdById, input.authorId),
            operators.isNull(fields.parentId),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      return pages ?? null;
    }),

  getPagesByParentId: protectedProcedure
    .input(
      z.object({
        parentId: z.number().describe("父页面id"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(operators.eq(fields.parentId, input.parentId));
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      return post ?? null;
    }),
});
