"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Globe2, RefreshCw, RotateCcw, TerminalSquare } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, StatusBadge } from "@/components/ui";

interface Deployment {
  id: string;
  status: string;
  url: string | null;
  providerDeploymentId?: string | null;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  repositoryUrl: string | null;
  defaultBranch: string;
  provider: string;
  deployments: Deployment[];
  domains: Array<{ id: string; domain: string; status: string; isPrimary: boolean }>;
}

export default function CloudProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [domain, setDomain] = useState("");
  const [logs, setLogs] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const response = await fetch("/api/cloud/projects", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load project");
    setProject((data.projects ?? []).find((item: Project) => item.id === params.id) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void load().catch((error) => {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load project" });
      setLoading(false);
    });
  }, [params.id]);

  const latest = useMemo(() => project?.deployments?.[0], [project]);

  async function refresh() {
    setBusy("refresh");
    try {
      if (latest?.id) await fetch(`/api/cloud/deployments/${latest.id}`, { cache: "no-store" });
      await load();
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to refresh" });
    } finally {
      setBusy("");
    }
  }

  async function restart() {
    setBusy("restart");
    setMessage(null);
    try {
      const response = await fetch(`/api/cloud/projects/${params.id}/restart`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Restart failed");
      setMessage({ type: "success", text: "Restart requested successfully." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Restart failed" });
    } finally {
      setBusy("");
    }
  }

  async function loadLogs() {
    if (!latest?.id) return;
    setBusy("logs");
    setMessage(null);
    try {
      const response = await fetch(`/api/cloud/deployments/${latest.id}/logs`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Logs unavailable");
      setLogs(data.logs ?? "");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Logs unavailable" });
    } finally {
      setBusy("");
    }
  }

  async function connectDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("domain");
    setMessage(null);
    try {
      const response = await fetch(`/api/cloud/projects/${params.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, isPrimary: project?.domains.length === 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to connect domain");
      setDomain("");
      setMessage({ type: "success", text: "Domain connected successfully." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to connect domain" });
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-8 sm:py-12">
          <div className="h-4 w-32 animate-pulse rounded bg-stone-100 dark:bg-stone-900" />
          <div className="h-10 w-64 animate-pulse rounded bg-stone-100 dark:bg-stone-900" />
          <div className="grid gap-4 md:grid-cols-3"><div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" /><div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" /><div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" /></div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white px-4 py-8 dark:bg-black sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="Project not found" description="This project may have been removed or you may no longer have access to it." action={<Link href="/cloud"><Button variant="secondary" size="sm">Back to Developer Cloud</Button></Link>} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-stone-950 dark:bg-black dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <Link href="/cloud" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-950 dark:hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Developer Cloud</Link>

        <header className="mt-7 border-b border-stone-200 pb-7 dark:border-stone-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Project</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
              <p className="mt-2 truncate text-sm text-stone-500">{project.repositoryUrl ?? "No repository"} · {project.defaultBranch} · {project.provider}</p>
            </div>
            <StatusBadge status={latest?.status ?? "new"} />
          </div>
        </header>

        <section className="grid gap-3 py-7 sm:grid-cols-3">
          <Button variant="secondary" onClick={() => void refresh()} disabled={busy !== ""}><RefreshCw className={`h-4 w-4 ${busy === "refresh" ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh status</Button>
          <Button variant="secondary" onClick={() => void restart()} disabled={busy !== ""}><RotateCcw className="h-4 w-4" aria-hidden="true" /> {busy === "restart" ? "Restarting…" : "Restart service"}</Button>
          <Button variant="secondary" onClick={() => void loadLogs()} disabled={busy !== "" || !latest?.id}><TerminalSquare className="h-4 w-4" aria-hidden="true" /> {busy === "logs" ? "Loading logs…" : "View logs"}</Button>
        </section>

        {message ? <div role="status" aria-live="polite" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>{message.text}</div> : null}

        {latest?.url ? (
          <a href={latest.url} target="_blank" rel="noreferrer" className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900">
            <span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Live deployment</span><span className="mt-1 block truncate text-sm font-medium">{latest.url}</span></span>
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        ) : null}

        <div className="grid gap-6">
          <Card className="p-6 sm:p-7">
            <div className="flex items-start gap-3"><Globe2 className="mt-0.5 h-5 w-5" aria-hidden="true" /><div><h2 className="font-semibold">Custom domain</h2><p className="mt-1 text-sm text-stone-500">Attach a domain and make the first domain primary automatically.</p></div></div>
            <form onSubmit={connectDomain} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Field label="Domain" required><Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="app.example.com" required /></Field>
              <div className="sm:self-end"><Button type="submit" disabled={!domain || busy !== ""}>{busy === "domain" ? "Connecting…" : "Connect domain"}</Button></div>
            </form>
            {project.domains.length ? <div className="mt-6 grid gap-2">{project.domains.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-800"><div className="min-w-0"><div className="truncate text-sm font-medium">{item.domain}</div><div className="mt-0.5 text-xs text-stone-500">{item.isPrimary ? "Primary domain" : "Additional domain"}</div></div><StatusBadge status={item.status} /></div>)}</div> : <p className="mt-5 text-sm text-stone-500">No custom domains connected.</p>}
          </Card>

          {logs ? <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-stone-200 px-6 py-4 dark:border-stone-800"><FileText className="h-4 w-4" aria-hidden="true" /><h2 className="font-semibold">Latest deployment logs</h2></div><pre className="max-h-96 overflow-auto bg-stone-950 p-5 text-xs leading-5 text-stone-200">{logs}</pre></Card> : null}

          <Card className="p-6 sm:p-7">
            <div className="flex items-end justify-between gap-4"><div><h2 className="font-semibold">Deployment history</h2><p className="mt-1 text-sm text-stone-500">Recent deployments and their provider identifiers.</p></div><span className="text-xs text-stone-500">{project.deployments.length} total</span></div>
            {project.deployments.length ? <div className="mt-5 grid gap-2">{project.deployments.map((deployment) => <div key={deployment.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><StatusBadge status={deployment.status} /><div className="min-w-0"><div className="truncate text-xs text-stone-500">{deployment.providerDeploymentId ?? deployment.id}</div>{deployment.createdAt ? <div className="mt-0.5 text-[11px] text-stone-400">{new Date(deployment.createdAt).toLocaleString()}</div> : null}</div></div>{deployment.url ? <a href={deployment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline">Open <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}</div>)}</div> : <div className="mt-5"><EmptyState title="No deployments yet" description="Once this project is deployed, its deployment history will appear here." /></div>}
          </Card>
        </div>
      </div>
    </main>
  );
}
