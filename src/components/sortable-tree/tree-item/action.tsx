import React, { forwardRef, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ActionProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: {
    fill: string;
    background: string;
  };
  cursor?: CSSProperties["cursor"];
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
    );
  },
);
