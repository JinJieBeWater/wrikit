import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages, pagesPinned } from "@/server/db/schema/pages";
import { PageTypeArray } from "@/types/page";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

export const createPageZod = z.object({
  id: z.string().optional().describe("页面id"),
  type: z.enum(PageTypeArray).describe("页面类型"),
  name: z.string().optional().describe("页面名称"),
  content: z.string().optional().describe("页面内容"),
  parentId: z.string().optional().describe("父页面id"),
});

export const pageRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().describe("页面id"),
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
        id: z.string().describe("页面id"),
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
        .where(
          and(
            eq(pages.id, input.id),
            eq(pages.createdById, ctx.session.user.id),
          ),
        );
    }),

  toggleTrash: protectedProcedure
    .input(
      z.object({
        id: z.string().describe("页面id"),
        isDeleted: z.boolean().describe("是否删除"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (trx) => {
        // 获取所有相关页面
        const getAllRelatedPages = async (rootId: string) => {
          const allPages = [];
          const stack = [rootId];

          while (stack.length > 0) {
            const currentId = stack.pop()!;
            const childPages = await trx.query.pages.findMany({
              where(fields, operators) {
                return operators.and(
                  operators.eq(fields.parentId, currentId),
                  operators.eq(fields.isDeleted, !input.isDeleted),
                );
              },
              columns: {
                id: true,
              },
            });
            const childPageIds = childPages.map((p) => p.id);
            allPages.push(...childPageIds);
            stack.push(...childPageIds);
          }

          return allPages;
        };

        // 批量更新页面状态
        const updatePages = async (pageIds: string[]) => {
          await trx
            .update(pages)
            .set({ isDeleted: input.isDeleted })
            .where(inArray(pages.id, pageIds));
        };

        // 批量删除pinned关系
        const deletePinned = async (pageIds: string[]) => {
          console.log("deletePinned", pageIds);

          await trx
            .delete(pagesPinned)
            .where(inArray(pagesPinned.pageId, pageIds));
        };

        // 获取所有相关页面ID
        const relatedPageIds = await getAllRelatedPages(input.id);

        // 更新所有相关页面
        const promises = [];
        promises.push(updatePages([input.id, ...relatedPageIds]));

        // 如果是删除操作，还需要删除pinned关系
        if (input.isDeleted) {
          promises.push(deletePinned([input.id, ...relatedPageIds]));
        }
        await Promise.all(promises);
      });
    }),

  getByParentId: protectedProcedure
    .input(
      z.object({
        parentId: z.string().optional().describe("父页面id，不传则获取根页面"),
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
              operators.eq(fields.createdById, ctx.session.user.id),
            );
          }
          return operators.and(
            operators.eq(fields.parentId, input.parentId),
            operators.eq(fields.isDeleted, input.isDeleted),
            operators.eq(fields.createdById, ctx.session.user.id),
          );
        },
        columns: {
          parentId: true,
          id: true,
          name: true,
          type: true,
          icon: true,
        },
        orderBy: (posts, { asc }) => [asc(posts.order), asc(posts.createdAt)],
      });
      return rootPages.map((page) => ({
        ...page,
        isDeleted: input.isDeleted,
      }));
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
          return operators.and(
            operators.eq(fields.isDeleted, input.isDeleted),
            operators.eq(fields.createdById, ctx.session.user.id),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
      });
      return page ?? null;
    }),

  infinitePage: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().default(10),
        isDeleted: z.boolean().default(false).describe("是否删除"),
        search: z.string().optional().describe("模糊查询条件"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.db.query.pages.findMany({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.isDeleted, true),
            operators.eq(fields.createdById, ctx.session.user.id),
            operators.eq(fields.isDeleted, input.isDeleted),
            input.cursor
              ? operators.gt(fields.updatedAt, new Date(input.cursor))
              : undefined,
            input.search
              ? operators.like(fields.name, `%${input.search}%`)
              : undefined,
          );
        },
        limit: input.limit,
        columns: {
          id: true,
          name: true,
          type: true,
          icon: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
        orderBy: (page, { asc }) => [asc(page.updatedAt)],
      });

      return {
        items: page.map((item) => ({
          ...item,
          isDeleted: input.isDeleted,
        })),
        nextCursor:
          page.length > 0
            ? page[page.length - 1]!.updatedAt!.toISOString()
            : null,
      };
    }),
});
