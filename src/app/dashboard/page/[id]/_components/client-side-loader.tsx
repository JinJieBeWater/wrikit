"use client";

import { api } from "@/trpc/react";
import { Page } from "@/types/page";
import { useEffect } from "react";
export const ClientSideLoader = ({ page }: { page: Page }) => {
  const utils = api.useUtils();
  useEffect(() => {
    utils.page.get.setData(
      {
        id: page.id,
      },
      page,
    );
  }, []);
  return null;
};
