import { pages, pagesPath, users } from "@/server/db/schema";
import type { z } from "zod";
import type { createPageZod } from "../routers/page";
import type { createTRPCContext } from "../trpc";
import type { Session } from "next-auth";
import { eq } from "drizzle-orm";

type Context = Awaited<ReturnType<typeof createTRPCContext>> & {
	session: Session;
};
export const createPageWithPagePath = async (
	ctx: Context,
	input: z.infer<typeof createPageZod>,
) => {
	return await ctx.db.transaction(async (trx) => {
		const id = input.id ?? crypto.randomUUID();
		const promises = [];

		const newPage = {
			...input,
			id,
			createdById: ctx.session.user.id,
		};

		// 创建页面
		promises.push(trx.insert(pages).values(newPage));

		/* 页面路径 */
		// 插入自引用路径
		promises.push(
			trx.insert(pagesPath).values({
				ancestor: id,
				descendant: id,
				depth: 0,
			}),
		);

		// 存在父页面时 添加所有父页面到当前页面的路径
		const parentId = input.parentId;
		if (parentId) {
			// 获取父页面在当前闭包表中作为子节点的所有路径记录 将depth+1后为当前节点插入路径
			const addPath = async ({
				parentId,
				id,
			}: { parentId: string; id: string }) => {
				const parentPaths = await trx.query.pagesPath.findMany({
					where: (fields, operators) => {
						return operators.and(
							// 查找父页面的所有路径
							operators.eq(fields.descendant, parentId),
						);
					},
				});
				await trx.insert(pagesPath).values(
					parentPaths.map((path) => ({
						ancestor: path.ancestor,
						descendant: id,
						depth: path.depth + 1,
					})),
				);
			};
			promises.push(addPath({ parentId, id }));
		}
		await Promise.all(promises);

		return newPage;
	});
};
