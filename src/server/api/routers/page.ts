import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages, pagesPinned } from "@/server/db/schema/pages";
import { PageTypeArray } from "@/types/page";
import { and, eq, inArray } from "drizzle-orm";
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
        id: z.number().describe("页面id"),
        isDeleted: z.boolean().describe("是否删除"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (trx) => {
        // 获取所有相关页面
        const getAllRelatedPages = async (rootId: number) => {
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
            });

            allPages.push(...childPages);
            stack.push(...childPages.map((p) => p.id));
          }

          return allPages;
        };

        // 批量更新页面状态
        const updatePages = async (pageIds: number[]) => {
          await trx
            .update(pages)
            .set({ isDeleted: input.isDeleted })
            .where(inArray(pages.id, pageIds));
        };

        // 批量删除pinned关系
        const deletePinned = async (pageIds: number[]) => {
          await trx
            .delete(pagesPinned)
            .where(inArray(pagesPinned.pageId, pageIds));
        };

        // 获取所有相关页面ID
        const relatedPages = await getAllRelatedPages(input.id);
        const relatedPageIds = relatedPages.map((p) => p.id);

        // 更新所有相关页面
        await updatePages([input.id, ...relatedPageIds]);

        // 如果是删除操作，还需要删除pinned关系
        if (input.isDeleted) {
          await deletePinned(relatedPageIds);
        }
      });
    }),

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
          return operators.and(
            operators.eq(fields.isDeleted, input.isDeleted),
            operators.eq(fields.createdById, ctx.session.user.id),
          );
        },
        orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
      });
      return page ?? null;
    }),
});
