import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type React from "react"
import { type CSSProperties, forwardRef } from "react"

export interface ActionProps extends React.HTMLAttributes<HTMLButtonElement> {
	active?: {
		fill: string
		background: string
	}
	cursor?: CSSProperties["cursor"]
}

export const Action = forwardRef<HTMLButtonElement, ActionProps>(
	({ active, className, cursor, style, ...props }, ref) => {
		return (
			<Button
				variant={"ghost"}
				size={"icon"}
				ref={ref}
				{...props}
				className={cn("size-6", className)}
				tabIndex={0}
				style={
					{
						...style,
						cursor,
						"--fill": active?.fill,
						"--background": active?.background,
					} as CSSProperties
				}
			/>
		)
	},
)
