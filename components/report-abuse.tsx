"use client";

import { AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import LoadingDots from "./icons/loading-dots";
import va from "@vercel/analytics";
import { toast } from "sonner";
import { Button, Input } from "./ui";

export default function ReportAbuse() {
  const [open, setOpen] = useState(false);
  const { domain, slug } = useParams() as { domain: string; slug?: string };
  const url = slug ? `https://${domain}/${slug}` : `https://${domain}`;

  return (
    <div className="fixed bottom-5 right-5 z-30">
      <Button
        type="button"
        variant="primary"
        aria-label={open ? "Close abuse report" : "Report abuse"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="h-11 w-11 rounded-full p-0 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
      >
        <AlertTriangle size={20} aria-hidden="true" />
      </Button>

      {open && (
        <form
          action={async (formData) => {
            const reportedUrl = formData.get("url") as string;
            va.track("Reported Abuse", { url: reportedUrl });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setOpen(false);
            toast.success("Report submitted. Thank you for helping keep the internet safe.");
          }}
          aria-label="Report abusive content"
          className="absolute bottom-14 right-0 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-black"
        >
          <div>
            <h2 className="font-cal text-xl leading-7 text-stone-900 dark:text-white">Report Abuse</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              Found a site with abusive content? Let us know.
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-900 dark:text-stone-200">URL to report</span>
            <Input type="url" name="url" readOnly value={url} aria-readonly="true" className="bg-stone-100 dark:bg-stone-900" />
          </label>

          <SubmitButton />
        </form>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <LoadingDots color="#808080" /> : "Report Abuse"}
    </Button>
  );
}
