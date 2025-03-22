import { api, RouterOutputs } from "@/trpc/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

export const usePageTrash = ({
  page,
}: {
  page: RouterOutputs["page"]["getByParentId"][0];
}) => {
  const utils = api.useUtils();

  const [pagesPinned] = api.pagePinned.get.useSuspenseQuery();
  const isPinned = useMemo(
    () => pagesPinned.some((p) => p.id === page.id),
    [page.id, pagesPinned],
  );

  const invalidateCache = useCallback(() => {
    if (page.parentId) {
      void utils.page.getByParentId.invalidate({
        parentId: page.parentId,
      });
    } else {
      if (isPinned) {
        void utils.pagePinned.get.invalidate();
      }
      void utils.page.getByParentId.invalidate({});
    }
  }, [page.parentId, utils]);

  const toggleTrash = api.page.toggleTrash.useMutation({
    onMutate(variables) {
      const prevParentCache = utils.page.getByParentId.getData({
        parentId: page.parentId ?? undefined,
      });
      if (variables.isDeleted) {
        toast.loading("Moving page to trash...");
      } else {
        toast.loading("Restoring page from trash...");
      }
      return { prevParentCache };
    },
    onError(error, variables, ctx) {},
    onSuccess: async (_data, variables) => {
      invalidateCache();
      toast.dismiss();
      if (variables.isDeleted) {
        toast.success("Page moved to trash", {
          description: "You can restore it from the trash",
          action: {
            label: "restore",
            onClick: () =>
              toggleTrash.mutate({
                id: variables.id,
                isDeleted: false,
              }),
          },
        });
      } else {
        toast.success("Page restored from trash");
      }
    },
  });
  return { toggleTrash };
};
