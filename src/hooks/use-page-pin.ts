import { useSession } from "@/components/provider/session-provider"
import { type RouterOutputs, api } from "@/trpc/react"
import { useState } from "react"

export const usePagePin = (page: RouterOutputs["page"]["getByParentId"][0]) => {
	const utils = api.useUtils()

	const [isPinned, setIsPinned] = useState(() => {
		return utils.pagePinned.get.getData()?.some((p) => p.id === page.id)
	})

	const createPinned = api.pagePinned.create.useMutation({
		onMutate() {
			setIsPinned(true)
			const prev = utils.pagePinned.get.getData()
			utils.pagePinned.get.setData(void 0, (pinnedPages) => {
				return [
					...(pinnedPages ?? []),
					{
						id: page.id,
						name: page.name,
						type: page.type,
						icon: page.icon,
						parentId: page.parentId,
						order: 0,
						isDeleted: false,
					},
				]
			})
			return { prev }
		},
		onError(_error, _variables, ctx) {
			setIsPinned(false)
			utils.pagePinned.get.setData(void 0, ctx?.prev)
		},
	})
	const deletePinned = api.pagePinned.delete.useMutation({
		onMutate() {
			setIsPinned(false)
			const prev = utils.pagePinned.get.getData()
			utils.pagePinned.get.setData(void 0, (pinnedPages) => {
				return pinnedPages?.filter((p) => p.id !== page.id)
			})
			return { prev }
		},
		onError(_error, _variables, ctx) {
			setIsPinned(true)
			utils.pagePinned.get.setData(void 0, ctx?.prev)
		},
	})

	return {
		isPinned,
		createPinned,
		deletePinned,
	}
}
