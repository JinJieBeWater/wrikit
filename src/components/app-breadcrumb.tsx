"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import React from "react";

export const AppBreadcrumb = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

    const name = searchParams.get("name");
    if (name) {
      items[items.length - 1]!.label = name;
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
        {/* <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem> */}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
