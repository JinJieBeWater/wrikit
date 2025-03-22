import { api, RouterOutputs } from "@/trpc/react";
import { useCallback } from "react";
import { toast } from "sonner";

export const usePageTrash = ({
  page,
}: {
  page: RouterOutputs["page"]["getByParentId"][0];
}) => {
  const utils = api.useUtils();

  const optimisticUpdate = useCallback(
    (variables: { id: number; isDeleted: boolean }) => {
      void utils.page.getByParentId.setData(
        {
          parentId: page.parentId ?? undefined,
        },
        (prev) => {
          if (variables.isDeleted) {
            return prev?.filter((p) => p.id !== variables.id);
          } else {
            return [
              ...(prev ?? []),
              {
                ...page,
              },
            ];
          }
        },
      );
      const isPinned = utils.pagePinned.get
        .getData()
        ?.some((p) => p.id === page.id);
      if (isPinned) {
        void utils.pagePinned.get.setData(void 0, (pinnedPages) => {
          return pinnedPages?.filter((p) => p.id !== variables.id);
        });
      }
    },
    [page.parentId, utils],
  );

  const toggleTrash = api.page.toggleTrash.useMutation({
    onMutate(variables) {
      optimisticUpdate(variables);

      return {
        prev: {
          id: variables.id,
          isDeleted: !variables.isDeleted,
        },
      };
    },
    onError(_error, variables, ctx) {
      ctx?.prev && optimisticUpdate(ctx?.prev);
      if (variables.isDeleted) {
        toast.error("Failed to move page to trash");
      } else {
        toast.error("Failed to restore page from trash");
      }
    },
    onSuccess: async (_data, variables) => {
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
