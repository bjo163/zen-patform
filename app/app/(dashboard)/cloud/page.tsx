"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Cloud, ExternalLink, GitBranch, Layers3, Plus, RefreshCw, Server } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, StatusBadge } from "@/components/ui";

interface Project {
  id: string;
  name: string;
  repositoryUrl: string | null;
  defaultBranch: string;
  provider: string;
  deployments: Array<{ id: string; status: string; url: string | null }>;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  priceIdr: number;
  cpuMillicores: number;
  memoryMb: number;
  storageGb: number;
  projectLimit: number;
}

async function fetchProjects() {
  const response = await fetch("/api/cloud/projects", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to load projects");
  return (data.projects ?? []) as Project[];
}

async function fetchPlans() {
  const response = await fetch("/api/cloud/plans", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to load plans");
  return (data.plans ?? []) as Plan[];
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatMemory(value: number) {
  return value >= 1024 ? `${value / 1024} GB` : `${value} MB`;
}

export default function CloudPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function refreshProjects() {
    const current = await fetchProjects();
    setProjects(current);
  }

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [currentProjects, currentPlans] = await Promise.all([fetchProjects(), fetchPlans()]);
        if (!active) return;
        setProjects(currentProjects);
        setPlans(currentPlans);
      } catch {
        // Preserve the last known state on transient polling failures.
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const [currentProjects, currentPlans] = await Promise.all([fetchProjects(), fetchPlans()]);
      setProjects(currentProjects);
      setPlans(currentPlans);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to refresh cloud data" });
    } finally {
      setRefreshing(false);
    }
  }

  async function deploy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/cloud/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, repositoryUrl, branch: branch || "main" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Deployment failed");
      setMessage({ type: "success", text: data.deployment?.url ? `Deployment created: ${data.deployment.url}` : "Deployment created and queued." });
      setName("");
      setRepositoryUrl("");
      setBranch("main");
      await refreshProjects();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Deployment failed" });
    } finally {
      setLoading(false);
    }
  }

  const starterPlan = plans.find((plan) => plan.code === "starter") ?? plans[0] ?? null;

  return (
    <main className="min-h-screen bg-white text-stone-950 dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-6 border-b border-stone-200 pb-8 dark:border-stone-800 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500"><Cloud className="h-4 w-4" aria-hidden="true" /> Developer Cloud</div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Ship without managing servers.</h1>
            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">Connect a repository, deploy through Coolify, and manage the lifecycle from one control plane.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void handleRefresh()} disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh</Button>
        </header>

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-stone-200 p-6 dark:border-stone-800 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" aria-hidden="true" /> New project</div><p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">Public GitHub or GitLab repository for the MVP deployment path.</p></div>
                <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-600 dark:border-stone-700 dark:text-stone-300">Coolify</span>
              </div>
            </div>
            <form onSubmit={deploy} className="grid gap-5 p-6 sm:p-7">
              <Field label="Project name" hint="A short human-readable name." required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-app" required autoComplete="off" /></Field>
              <Field label="Repository URL" hint="For example: https://github.com/owner/repository" required><Input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository" type="url" required /></Field>
              <Field label="Branch" hint="The branch to deploy. Defaults to main."><Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" /></Field>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Button type="submit" disabled={loading}><Server className="h-4 w-4" aria-hidden="true" />{loading ? "Deploying…" : "Deploy project"}</Button>{message ? <p role="status" aria-live="polite" className={`text-sm ${message.type === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{message.text}</p> : null}</div>
            </form>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Current plan</div>
            {starterPlan ? <>
              <div className="mt-4 text-3xl font-bold tracking-tight">{starterPlan.priceIdr === 0 ? "Free" : formatIdr(starterPlan.priceIdr)}{starterPlan.priceIdr > 0 ? <span className="text-sm font-normal text-stone-500"> / bulan</span> : null}</div>
              <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{starterPlan.name} · pricing and resource limits are loaded from the cloud catalog.</p>
              <div className="mt-6 grid gap-3 border-t border-stone-200 pt-5 text-sm dark:border-stone-800">
                <div className="flex items-center justify-between"><span className="text-stone-500">Projects</span><span className="font-medium">{starterPlan.projectLimit}</span></div>
                <div className="flex items-center justify-between"><span className="text-stone-500">CPU</span><span className="font-medium">{starterPlan.cpuMillicores >= 1000 ? `${starterPlan.cpuMillicores / 1000} vCPU` : `${starterPlan.cpuMillicores} mCPU`}</span></div>
                <div className="flex items-center justify-between"><span className="text-stone-500">RAM</span><span className="font-medium">{formatMemory(starterPlan.memoryMb)}</span></div>
                <div className="flex items-center justify-between"><span className="text-stone-500">Storage</span><span className="font-medium">{starterPlan.storageGb} GB</span></div>
              </div>
            </> : <p className="mt-4 text-sm leading-6 text-stone-500 dark:text-stone-400">No published cloud plan yet. Configure the catalog to show pricing here.</p>}
          </Card>
        </div>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Workspace</div><h2 className="mt-1.5 text-xl font-bold tracking-tight">Projects</h2></div><span className="text-sm text-stone-500">{projects.length} total</span></div>
          {projects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => { const latest = project.deployments?.[0]; return <Card key={project.id} className="group overflow-hidden transition-shadow hover:shadow-md"><div className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate font-semibold">{project.name}</h3><p className="mt-1 truncate text-xs text-stone-500">{project.repositoryUrl ?? "No repository"}</p></div><StatusBadge status={latest?.status ?? "new"} /></div><div className="mt-5 grid gap-2 text-xs text-stone-500"><div className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5" aria-hidden="true" />{project.defaultBranch}</div><div className="flex items-center gap-2"><Layers3 className="h-3.5 w-3.5" aria-hidden="true" />Provider: {project.provider}</div></div></div><div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-5 py-3 dark:border-stone-800 dark:bg-stone-950">{latest?.url ? <a href={latest.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-stone-700 hover:underline dark:text-stone-300"><ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">Live deployment</span></a> : <span className="text-xs text-stone-500">No deployment URL yet</span>}<Link href={`/cloud/${project.id}`} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400">Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div></Card>; })}</div> : <EmptyState title="No projects yet" description="Create your first project above and it will appear here with its latest deployment status." />}
        </section>
      </div>
    </main>
  );
}
