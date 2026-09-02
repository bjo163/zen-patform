"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";

export default function LogoutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Log out"
      onClick={() => void signOut()}
      className="px-2"
    >
      <LogOut width={18} aria-hidden="true" />
    </Button>
  );
}
