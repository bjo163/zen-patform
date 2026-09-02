/* eslint-disable @next/next/no-img-element */

import { truncate } from "@/lib/utils";
import { ImageResponse } from "next/og";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, sites, users } from "@/lib/all-schema";

export const runtime = "nodejs";

export default async function PostOG({
  params,
}: {
  params: { domain: string; slug: string };
}) {
  const domain = decodeURIComponent(params.domain);
  const slug = decodeURIComponent(params.slug);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const subdomain = rootDomain && domain.endsWith(`.${rootDomain}`)
    ? domain.replace(`.${rootDomain}`, "")
    : null;

  const rows = await db
    .select({
      title: posts.title,
      description: posts.description,
      image: posts.image,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(posts)
    .innerJoin(sites, eq(posts.siteId, sites.id))
    .innerJoin(users, eq(sites.userId, users.id))
    .where(
      and(
        or(eq(sites.subdomain, subdomain ?? ""), eq(sites.customDomain, domain)),
        eq(posts.slug, slug),
      ),
    )
    .limit(1);

  const data = rows[0];

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const clashData = await fetch(
    new URL("@/styles/CalSans-SemiBold.otf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center w-full h-full bg-white">
        <div tw="flex flex-col items-center justify-center mt-8">
          <h1 tw="text-6xl font-bold text-gray-900 leading-none tracking-tight">
            {data.title}
          </h1>
          <p tw="mt-4 text-xl text-gray-600 max-w-xl text-center">
            {truncate(data.description ?? "", 120)}
          </p>
          <div tw="flex items-center justify-center">
            {data.authorImage ? (
              <img
                tw="w-12 h-12 rounded-full mr-4"
                src={data.authorImage}
                alt={data.authorName ?? "Author"}
              />
            ) : null}
            <p tw="text-xl font-medium text-gray-900">
              by {data.authorName ?? "Author"}
            </p>
          </div>
          {data.image ? (
            <img
              tw="mt-4 w-5/6 rounded-2xl border border-gray-200 shadow-md"
              src={data.image}
              alt={data.title ?? "Post"}
            />
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: "Clash",
          data: clashData,
        },
      ],
      emoji: "blobmoji",
    },
  );
}
