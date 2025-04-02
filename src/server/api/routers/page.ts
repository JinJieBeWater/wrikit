import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pagesPinned, pages } from "@/server/db/schema";
import { PageTypeArray } from "@/types/page";
import { and, count, eq, inArray, like } from "drizzle-orm";
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
        cursor: z
          .object({
            updatedAt: z.date(),
            id: z.string(),
          })
          .optional(),
        limit: z.number().default(10),
        isDeleted: z.boolean().default(false).describe("是否删除"),
        name: z.string().optional().describe("模糊查询条件"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const infiniteData = await Promise.all([
        // 分页查询数据
        ctx.db.query.pages.findMany({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.createdById, ctx.session.user.id),
              operators.eq(fields.isDeleted, input.isDeleted),
              input.name
                ? operators.like(fields.name, `%${input.name}%`)
                : undefined,
              input.cursor
                ? operators.or(
                    operators.lt(fields.updatedAt, input.cursor.updatedAt),
                    operators.and(
                      operators.eq(fields.updatedAt, input.cursor.updatedAt),
                      operators.lt(fields.id, input.cursor.id),
                    ),
                  )
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
          orderBy: (page, { desc }) => [desc(page.updatedAt), desc(page.id)],
        }),
        // 查询长度
        ctx.db
          .select({ count: count() })
          .from(pages)
          .where(
            and(
              eq(pages.createdById, ctx.session.user.id),
              eq(pages.isDeleted, input.isDeleted),
              input.name ? like(pages.name, `%${input.name}%`) : undefined,
            ),
          ),
      ]);
      const [page, totalCount] = infiniteData;

      const nextCursor =
        page.length > 0
          ? {
              updatedAt: page[page.length - 1]!.updatedAt!,
              id: page[page.length - 1]!.id,
            }
          : null;

      return {
        items: page.map((item) => ({
          ...item,
          isDeleted: input.isDeleted,
        })),
        meta: {
          totalRowCount: totalCount[0]?.count ?? 0,
          nextCursor: nextCursor,
        },
      };
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
          return operators.and(
            input.parentId === undefined
              ? operators.isNull(fields.parentId)
              : operators.eq(fields.parentId, input.parentId),
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
            const childPages = await trx.query.pages.findMany({
              where(fields, operators) {
                return operators.and(
                  operators.inArray(fields.parentId, stack),
                  operators.eq(fields.isDeleted, !input.isDeleted),
                );
              },
              columns: {
                id: true,
              },
            });
            // 清空stack
            stack.length = 0;
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
          await trx
            .delete(pagesPinned)
            .where(inArray(pagesPinned.pageId, pageIds));
        };

        // 获取所有相关页面ID
        const relatedPageIds = await getAllRelatedPages(input.id);

        // 更新所有相关页面
        const promises = [];
        promises.push(updatePages([input.id, ...relatedPageIds]));

        // 如果是删除操作
        if (input.isDeleted) {
          // 需要删除pinned关系
          promises.push(deletePinned([input.id, ...relatedPageIds]));
        }
        // 如果是还原操作
        if (!input.isDeleted) {
          // 删除与父页面的关系
          promises.push(
            trx
              .update(pages)
              .set({ parentId: null })
              .where(eq(pages.id, input.id)),
          );
        }
        await Promise.all(promises);
      });
    }),

  clearTrash: protectedProcedure.mutation(async ({ ctx }) => {
    // 查找当前用户所有已删除的页面
    const trashedPages = await ctx.db.query.pages.findMany({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.isDeleted, true),
          operators.eq(fields.createdById, ctx.session.user.id),
        );
      },
      columns: {
        id: true,
      },
    });

    const pageIds = trashedPages.map((page) => page.id);

    if (pageIds.length === 0) {
      return { count: 0 };
    }

    // 删除相关的收藏记录
    await ctx.db
      .delete(pagesPinned)
      .where(inArray(pagesPinned.pageId, pageIds));

    // 删除所有已标记为删除的页面
    const result = await ctx.db
      .delete(pages)
      .where(
        and(
          eq(pages.isDeleted, true),
          eq(pages.createdById, ctx.session.user.id),
        ),
      );

    return { count: pageIds.length };
  }),

  delete: protectedProcedure
    .input(z.array(z.string()).describe("页面id数组"))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (trx) => {
        const getAllRelatedPages = async (rootIds: string[]) => {
          const allPages = [...rootIds];
          const stack = [...rootIds];

          while (stack.length > 0) {
            const childPages = await trx.query.pages.findMany({
              where(fields, operators) {
                return operators.and(operators.inArray(fields.parentId, stack));
              },
              columns: {
                id: true,
              },
            });
            // 清空stack
            stack.length = 0;
            const childPageIds = childPages.map((p) => p.id);
            allPages.push(...childPageIds);
            stack.push(...childPageIds);
          }

          return allPages;
        };

        const relatedPageIds = await getAllRelatedPages(input);

        // 删除所有相关页面
        const result = await trx
          .delete(pages)
          .where(inArray(pages.id, relatedPageIds))
          .returning({
            id: pages.id,
          });

        return { count: result.length };
      });
    }),
});
