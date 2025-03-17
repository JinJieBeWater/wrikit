import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages } from "@/server/db/schema/pages";
import { type PageTree, PageTypeArray } from "@/types/page";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const createPageZod = z.object({
  type: z.enum(PageTypeArray).describe("页面类型"),
  name: z.string().optional().describe("页面名称"),
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

  moveToTrash: protectedProcedure
    .input(
      z.object({
        id: z.number().describe("页面id"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pages)
        .set({ isDeleted: true })
        .where(eq(pages.id, input.id));

      const deleteChildren = async (id: number) => {
        const childPages = await ctx.db.query.pages.findMany({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.parentId, id),
              operators.eq(fields.isDeleted, false),
            );
          },
        });

        for (const childPage of childPages) {
          await ctx.db
            .update(pages)
            .set({ isDeleted: true })
            .where(eq(pages.id, childPage.id));
          await deleteChildren(childPage.id);
        }
      };

      await deleteChildren(input.id);
    }),

  restoreFromTrash: protectedProcedure
    .input(
      z.object({
        id: z.number().describe("页面id"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pages)
        .set({ isDeleted: false })
        .where(eq(pages.id, input.id));

      const restoreChildren = async (id: number) => {
        const childPages = await ctx.db.query.pages.findMany({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.parentId, id),
              operators.eq(fields.isDeleted, true),
            );
          },
        });

        for (const childPage of childPages) {
          await ctx.db
            .update(pages)
            .set({ isDeleted: false })
            .where(eq(pages.id, childPage.id));
          await restoreChildren(childPage.id);
        }
      };

      await restoreChildren(input.id);
    }),

  getTree: protectedProcedure
    .input(
      z.object({
        authorId: z.string().describe("作者id"),
        isDeleted: z.boolean().default(false).describe("是否删除"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rootPages = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.createdById, input.authorId),
            operators.isNull(fields.parentId),
            operators.eq(fields.isDeleted, input.isDeleted),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });

      const getPagesByParentId = async (
        parentId: number,
      ): Promise<PageTree[]> => {
        const pages = await ctx.db.query.pages.findMany({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.parentId, parentId),
              operators.eq(fields.isDeleted, input.isDeleted),
            );
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

  getRoots: protectedProcedure
    .input(
      z.object({
        authorId: z.string().describe("作者id"),
        isDeleted: z.boolean().default(false).describe("是否删除"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rootPages = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.createdById, input.authorId),
            operators.eq(fields.isDeleted, input.isDeleted),
            operators.isNull(fields.parentId),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      return rootPages ?? null;
    }),

  ByParentId: protectedProcedure
    .input(
      z.object({
        parentId: z.number().describe("父页面id"),
        isDeleted: z.boolean().default(false).describe("是否删除"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.parentId, input.parentId),
            operators.eq(fields.isDeleted, input.isDeleted),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      return post ?? null;
    }),

  getLatest: protectedProcedure.query(async ({ ctx, input }) => {
    const page = await ctx.db.query.pages.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.isDeleted, false));
      },
      orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
    });
    return page ?? null;
  }),
});
