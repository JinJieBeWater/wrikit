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

export const AppBreadcrumb = () => {
  const pathname = usePathname();
  const [breadcrumbs, setItems] = useState<
    {
      path: string;
      label: string;
    }[]
  >();

  const getBreadcrumbs = useCallback((pathname: string) => {
    const paths = pathname.split("/");
    paths.shift();
    const items = [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths.slice(0, i + 1).join("/");
      items.push({
        path,
        label: paths[i] ?? "",
      });
    }
    return items;
  }, []);

  useEffect(() => {
    setItems(getBreadcrumbs(pathname));
  }, [pathname]);

  // const items = useMemo(() => {
  //   const paths = pathname.split("/");
  //   paths.shift();
  //   const items = [];

  //   for (let i = 0; i < paths.length; i++) {
  //     // 获取当前面包屑对应的路径
  //     const path = "/" + paths.slice(0, i + 1).join("/");

  //     if (path.startsWith("/dashboard/page/")) {
  //       const page = utils.page.get.getData({
  //         id: Number(params.id),
  //       });
  //       if (page) {
  //         console.log(page);

  //         items.push({
  //           path,
  //           label: page.name ?? "Untitled",
  //         });
  //         break;
  //       }
  //     }
  //     items.push({
  //       path,
  //       label: paths[i],
  //     });
  //   }

  //   return items;
  // }, [pathname, params.id]);

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
