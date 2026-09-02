"use client";

import { useEffect, useState, useTransition } from "react";
import { updatePost, updatePostMetadata } from "@/lib/actions";
import { Editor as NovelEditor } from "novel";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import LoadingDots from "./icons/loading-dots";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { SelectPost } from "@/lib/schema";
import { Button } from "./ui";

type PostWithSite = SelectPost & { site: { subdomain: string | null } | null };

export default function Editor({ post }: { post: PostWithSite }) {
  const [isPendingSaving, startTransitionSaving] = useTransition();
  const [isPendingPublishing, startTransitionPublishing] = useTransition();
  const [data, setData] = useState<PostWithSite>(post);

  const url = process.env.NEXT_PUBLIC_VERCEL_ENV
    ? `https://${data.site?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${data.slug}`
    : `http://${data.site?.subdomain}.localhost:3000/${data.slug}`;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        startTransitionSaving(async () => {
          await updatePost(data);
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [data, startTransitionSaving]);

  return (
    <div className="relative min-h-[500px] w-full max-w-screen-lg border-stone-200 p-8 sm:mb-[calc(20vh)] sm:rounded-xl sm:border sm:p-12 sm:shadow-sm dark:border-stone-700 dark:bg-black">
      <div className="absolute right-5 top-5 flex items-center gap-3">
        {data.published && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open published post"
            className="inline-flex rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <div
          aria-live="polite"
          className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400"
        >
          {isPendingSaving ? "Saving…" : "Saved"}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPendingPublishing}
          onClick={() => {
            const formData = new FormData();
            formData.append("published", String(!data.published));
            startTransitionPublishing(async () => {
              await updatePostMetadata(formData, post.id, "published").then(() => {
                toast.success(`Successfully ${data.published ? "unpublished" : "published"} your post.`);
                setData((prev) => ({ ...prev, published: !prev.published }));
              });
            });
          }}
        >
          {isPendingPublishing ? <LoadingDots /> : data.published ? "Unpublish" : "Publish"}
        </Button>
      </div>

      <div className="mb-5 flex flex-col space-y-3 border-b border-stone-200 pb-5 pr-36 dark:border-stone-700">
        <label className="sr-only" htmlFor="post-title">Title</label>
        <input
          id="post-title"
          type="text"
          placeholder="Title"
          defaultValue={post?.title || ""}
          autoFocus
          onChange={(e) => setData({ ...data, title: e.target.value })}
          className="border-none px-0 font-cal text-3xl placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:bg-black dark:text-white"
        />
        <label className="sr-only" htmlFor="post-description">Description</label>
        <TextareaAutosize
          id="post-description"
          placeholder="Description"
          defaultValue={post?.description || ""}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className="w-full resize-none border-none px-0 placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:bg-black dark:text-white"
        />
      </div>

      <NovelEditor
        className="relative block"
        defaultValue={post?.content || undefined}
        onUpdate={(editor) => {
          setData((prev) => ({
            ...prev,
            content: editor?.storage.markdown.getMarkdown(),
          }));
        }}
        onDebouncedUpdate={() => {
          if (data.title === post.title && data.description === post.description && data.content === post.content) {
            return;
          }
          startTransitionSaving(async () => {
            await updatePost(data);
          });
        }}
      />
    </div>
  );
}
