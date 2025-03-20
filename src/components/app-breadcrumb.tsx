"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import React from "react";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

export const AppBreadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs?.map((item, index) => (
          <React.Fragment key={`${index}`}>
            <BreadcrumbItem>
              <BreadcrumbLink href={`${item.path}`}>
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs?.length - 1 !== index && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
