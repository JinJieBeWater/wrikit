import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages, pagesPinned } from "@/server/db/schema/pages";
import { PageTypeArray } from "@/types/page";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const createPageZod = z.object({
  type: z.enum(PageTypeArray).describe("页面类型"),
  name: z.string().optional().describe("页面名称"),
  content: z.string().optional().describe("页面内容"),
  parentId: z.number().optional().describe("父页面id"),
});

export const pageRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        id: z.number().describe("页面id"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.db.query.pages.findFirst({
        where(fields, operators) {
          return operators.and(operators.eq(fields.id, input.id));
        },
      });
      return page ?? null;
    }),

  create: protectedProcedure
    .meta({ description: "创建新页面" })
    .input(createPageZod)
    .mutation(async ({ ctx, input }) => {
      const [insertedPage] = await ctx.db
        .insert(pages)
        .values({
          ...input,
          createdById: ctx.session.user.id,
        })
        .returning();
      return insertedPage;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().describe("页面id"),
        name: z.string().optional().describe("页面名称"),
        content: z.string().optional().describe("页面内容"),
        order: z.number().optional().describe("排序顺序"),
        isPinned: z.boolean().optional().describe("是否置顶"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pages)
        .set({
          name: input.name,
          content: input.content,
          order: input.order,
        })
        .where(and(eq(pages.id, input.id)));
    }),

  toggleTrash: protectedProcedure
    .input(
      z.object({
        id: z.number().describe("页面id"),
        isDeleted: z.boolean().describe("是否删除"),
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
              operators.eq(fields.isDeleted, input.isDeleted),
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

  // getTree: protectedProcedure
  //   .input(
  //     z.object({
  //       authorId: z.string().describe("作者id"),
  //       isDeleted: z.boolean().default(false).describe("是否删除"),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const rootPages = await ctx.db.query.pages.findMany({
  //       where(fields, operators) {
  //         return operators.and(
  //           operators.eq(fields.createdById, input.authorId),
  //           operators.isNull(fields.parentId),
  //           operators.eq(fields.isDeleted, input.isDeleted),
  //         );
  //       },
  //       orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //     });

  //     const getPagesByParentId = async (
  //       parentId: number,
  //     ): Promise<PageTree[]> => {
  //       const pages = await ctx.db.query.pages.findMany({
  //         where(fields, operators) {
  //           return operators.and(
  //             operators.eq(fields.parentId, parentId),
  //             operators.eq(fields.isDeleted, input.isDeleted),
  //           );
  //         },
  //         orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //       });

  //       const pageTree: PageTree[] = [];
  //       for (const page of pages) {
  //         const child = await getPagesByParentId(page.id);
  //         pageTree.push({
  //           ...page,
  //           child,
  //         });
  //       }
  //       return pageTree;
  //     };

  //     const pageTree: PageTree[] = [];
  //     for (const page of rootPages) {
  //       const child = await getPagesByParentId(page.id);
  //       pageTree.push({
  //         ...page,
  //         child,
  //       });
  //     }

  //     return pageTree;
  //   }),

  getByParentId: protectedProcedure
    .input(
      z.object({
        parentId: z.number().optional().describe("父页面id，不传则获取根页面"),
        isDeleted: z.boolean().default(false).describe("是否删除"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rootPages = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          if (input.parentId === undefined) {
            return operators.and(
              operators.isNull(fields.parentId),
              operators.eq(fields.isDeleted, input.isDeleted),
            );
          }
          return operators.and(
            operators.eq(fields.parentId, input.parentId),
            operators.isNull(fields.parentId),
          );
        },
        orderBy: (posts, { asc, desc }) => [
          asc(posts.order),
          desc(posts.createdAt),
        ],
      });
      return rootPages ?? null;
    }),

  getLatest: protectedProcedure
    .input(
      z
        .object({
          isDeleted: z.boolean().default(false).describe("是否删除"),
        })
        .default({
          isDeleted: false,
        }),
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.db.query.pages.findFirst({
        where(fields, operators) {
          return operators.and(operators.eq(fields.isDeleted, input.isDeleted));
        },
        orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
      });
      return page ?? null;
    }),

  createPinned: protectedProcedure
    .input(
      z.object({
        userId: z.string().describe("用户id"),
        pageId: z.number().describe("页面id"),
        order: z.number().default(0).describe("排序顺序 0为默认"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pagesPinned)
        .values({
          userId: input.userId,
          pageId: input.pageId,
          order: input.order,
        })
        .returning();
    }),
});
