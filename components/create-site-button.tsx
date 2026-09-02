"use client";

import { useModal } from "@/components/modal/provider";
import { Button } from "@/components/ui";
import { ReactNode } from "react";

export default function CreateSiteButton({
  children,
}: {
  children: ReactNode;
}) {
  const modal = useModal();

  return (
    <Button type="button" size="sm" onClick={() => modal?.show(children)}>
      Create New Site
    </Button>
  );
}
