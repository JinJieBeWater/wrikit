"use client";
import { useParams, usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: Dispatch<SetStateAction<BreadcrumbItem[]>>;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  const pathname = usePathname();

  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }

  const { breadcrumbs, setBreadcrumbs } = context;

  const getBreadcrumbs = useCallback((pathname: string) => {
    const paths = pathname.split("/");
    paths.shift();
    const items: BreadcrumbItem[] = [];
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
    setBreadcrumbs(getBreadcrumbs(pathname));
  }, [pathname, getBreadcrumbs, setBreadcrumbs]);

  return {
    breadcrumbs,
    setBreadcrumbs,
  };
}
