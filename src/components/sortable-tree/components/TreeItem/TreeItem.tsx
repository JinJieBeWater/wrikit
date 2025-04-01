import React, { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { UniqueIdentifier } from "@dnd-kit/core";
import { Handle } from "./Handle";
import { Action } from "./Action";
import { Remove } from "./Remove";
import { ChevronDown } from "lucide-react";

export interface Props extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: any;
  indicator?: boolean;
  indentationWidth: number;
  value: UniqueIdentifier;
  onCollapse?(): void;
  onRemove?(): void;
  wrapperRef?(node: HTMLLIElement): void;
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
          clone && "pointer-events-none inline-block p-0 pl-[10px] pt-[5px]",
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
            <div className="absolute left-[-8px] top-[-4px] block h-[12px] w-[12px] rounded-full border border-[#2389ff] bg-white before:content-['']"></div>
          )}
          {ghost && indicator && <div className="h-0 opacity-0"></div>}
          {onCollapse && (
            <Action
              onClick={onCollapse}
              className={cn(
                "duration-250 transition-transform ease-in-out",
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
            <span className="absolute right-[-10px] top-[-10px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#2389ff] text-[0.8rem] font-semibold text-white">
              {childCount}
            </span>
          ) : null}
        </div>
      </li>
    );
  },
);

const collapseIcon = <ChevronDown />;
