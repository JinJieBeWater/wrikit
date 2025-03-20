"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import React from "react";

export const AppBreadcrumb = () => {
  const pathname = usePathname();

  const items = useMemo(() => {
    const paths = pathname.split("/");
    paths.shift();
    const items = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths.slice(0, i + 1).join("/");
      items.push({
        path,
        label: paths[i],
      });
    }

    return items;
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={`${index}`}>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${item.path}`}>
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {items.length - 1 !== index && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
