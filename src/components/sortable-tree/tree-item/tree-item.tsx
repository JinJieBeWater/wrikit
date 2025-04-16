import { cn } from "@/lib/utils"
import type { UniqueIdentifier } from "@dnd-kit/core"
import { ChevronDown } from "lucide-react"
import type React from "react"
import { type HTMLAttributes, forwardRef } from "react"
import { Action, type ActionProps } from "./action"
import { Handle } from "./handle"
import { Remove } from "./remove"

export interface Props extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
	childCount?: number
	clone?: boolean
	collapsed?: boolean
	depth: number
	disableInteraction?: boolean
	disableSelection?: boolean
	ghost?: boolean
	handleProps?: ActionProps
	indicator?: boolean
	indentationWidth: number
	value: UniqueIdentifier
	onCollapse?(): void
	onRemove?(): void
	wrapperRef?(node: HTMLLIElement): void
}

export const TreeItem = forwardRef<HTMLDivElement, Props>(
	(
		{
			childCount,
			clone,
			depth,
			disableSelection,
			disableInteraction,
			ghost,
			handleProps,
			indentationWidth,
			indicator,
			collapsed,
			onCollapse,
			onRemove,
			style,
			value,
			wrapperRef,
			...props
		},
		ref,
	) => {
		return (
			<li
				className={cn(
					"-mb-px box-border list-none",
					clone && "pointer-events-none inline-block p-0 pt-[5px] pl-[10px]",
					ghost && "opacity-50",
					ghost && indicator && "relative z-[1] mb-[-1px] opacity-100",
					disableSelection && "select-none",
					disableInteraction && "pointer-events-none",
				)}
				ref={wrapperRef}
				style={
					{
						paddingLeft: `${indentationWidth * depth}px`,
					} as React.CSSProperties
				}
				{...props}
			>
				<div
					className={cn(
						"relative box-border flex items-center border border-[#dedede] bg-white px-[10px] py-[10px] text-[#222]",
						clone &&
							"rounded-[4px] pr-[24px] shadow-[0px_15px_15px_0_rgba(34,33,81,0.1)]",
						ghost &&
							indicator &&
							"relative h-[8px] border-[#2389ff] bg-[#56a1f8] p-0",
					)}
					ref={ref}
					style={style}
				>
					<Handle {...handleProps} />
					{ghost && indicator && (
						<div className="absolute top-[-4px] left-[-8px] block h-[12px] w-[12px] rounded-full border border-[#2389ff] bg-white before:content-['']" />
					)}
					{ghost && indicator && <div className="h-0 opacity-0" />}
					{onCollapse && (
						<Action
							onClick={onCollapse}
							className={cn(
								"transition-transform duration-250 ease-in-out",
								collapsed && "rotate-[-90deg]",
							)}
						>
							{collapseIcon}
						</Action>
					)}
					<span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap pl-2">
						{value}
					</span>
					{!clone && onRemove && <Remove onClick={onRemove} />}
					{clone && childCount && childCount > 1 ? (
						<span className="absolute top-[-10px] right-[-10px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#2389ff] font-semibold text-[0.8rem] text-white">
							{childCount}
						</span>
					) : null}
				</div>
			</li>
		)
	},
)

const collapseIcon = <ChevronDown />
