import { GridPattern } from "@/components/magicui/grid-pattern";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@udecode/cn";

export default function Loading() {
	return (
		<div className="flex h-full w-full flex-col">
			<div className="relative flex h-52 w-full shrink-0 items-end overflow-hidden bg-background px-12 pb-4 sm:px-page">
				<GridPattern
					width={20}
					height={20}
					x={-1}
					y={-1}
					className={cn(
						"[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
					)}
				/>
				<Skeleton className="size-20" />
			</div>
			<div className="flex grow flex-col gap-6 px-12 pb-72 sm:px-page">
				<Skeleton className="h-16 shrink-0 rounded-xl" />
				<Skeleton className="w-full grow rounded-xl" />
			</div>
		</div>
	);
}
