"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function CloudError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white px-4 py-8 dark:bg-black sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Developer Cloud is temporarily unavailable"
          description={error.message || "Something went wrong while loading this workspace."}
          action={
            <Button variant="secondary" size="sm" onClick={() => reset()}>
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Try again
            </Button>
          }
        />
      </div>
    </main>
  );
}
