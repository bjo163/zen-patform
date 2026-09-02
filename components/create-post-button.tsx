"use client";

import { useTransition } from "react";
import { createPost } from "@/lib/actions";
import { useParams, useRouter } from "next/navigation";
import LoadingDots from "@/components/icons/loading-dots";
import va from "@vercel/analytics";
import { Button } from "@/components/ui";

export default function CreatePostButton() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      className="w-36"
      onClick={() =>
        startTransition(async () => {
          const post = await createPost(null, id, null);
          va.track("Created Post");
          router.refresh();
          router.push(`/post/${post.id}`);
        })
      }
      disabled={isPending}
    >
      {isPending ? <LoadingDots color="#808080" /> : "Create New Post"}
    </Button>
  );
}
