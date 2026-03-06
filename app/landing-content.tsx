"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Plus,
  LogOut,
  List,
  LayoutGrid,
  Linkedin,
  Github,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  ListOrdered,
} from "lucide-react";
import type { Project } from "@/lib/models/Project";
import type { SiteLinks } from "@/lib/models/SiteLinks";
import { logout } from "@/app/actions/auth";
import { reorderProjects } from "@/app/actions/projects";
import {
  ProjectCard,
  ProjectListRow,
  SortableProjectListRow,
} from "@/app/project-display";
import { AddProjectModal } from "@/app/project-form-modals";
import { EditSiteLinksModal, SettingsModal } from "@/app/settings-modals";

export function LandingContent({
  initialProjects,
  initialLoggedIn,
  initialSiteLinks,
}: {
  initialProjects: Project[];
  initialLoggedIn: boolean;
  initialSiteLinks: SiteLinks;
}) {
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [siteLinksEditOpen, setSiteLinksEditOpen] = useState(false);
  const [siteLinks, setSiteLinks] = useState<SiteLinks>(initialSiteLinks);
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [sortBy, setSortBy] = useState<"default" | "asc" | "desc">("default");
  const router = useRouter();
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    setSiteLinks(initialSiteLinks);
  }, [initialSiteLinks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialProjects;
    return initialProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [initialProjects, query]);

  const displayList = useMemo(() => {
    if (sortBy === "default") return filtered;
    if (sortBy === "asc") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
  }, [filtered, sortBy]);

  function refresh() {
    router.refresh();
  }

  const isEditMode = initialLoggedIn;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="text-lg font-semibold text-foreground hover:text-foreground/90 transition-colors"
            >
              Mustafa&apos;s Portfolio
            </Link>
            {isEditMode && (
              <span
                className="font-bold uppercase text-red-600 dark:text-red-400"
                aria-label="Edit mode is on"
              >
                EDIT MODE
              </span>
            )}
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              {[
                { domain: "microsoft.com", alt: "Microsoft" },
                { domain: "aws.amazon.com", alt: "AWS" },
                { domain: "intuit.com", alt: "Intuit" },
                { domain: "harness.io", alt: "Harness" },
              ].map(({ domain, alt }) => (
                <img
                  key={domain}
                  src={`https://img.logo.dev/${domain}?token=pk_TpV6cBsNRw6eLkvygVgOkQ&size=64&format=png`}
                  alt={alt}
                  title={alt}
                  className="size-6 rounded object-contain"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <img
              src="https://img.logo.dev/cmu.edu?token=pk_TpV6cBsNRw6eLkvygVgOkQ&size=64&format=png"
              alt="Carnegie Mellon University"
              title="Carnegie Mellon University"
              className="size-6 rounded object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSiteLinksEditOpen(true)}
                  aria-label="Edit LinkedIn and GitHub links"
                >
                  <Linkedin className="size-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSiteLinksEditOpen(true)}
                  aria-label="Edit LinkedIn and GitHub links"
                >
                  <Github className="size-4" />
                  Github
                </Button>
                <Dialog open={siteLinksEditOpen} onOpenChange={setSiteLinksEditOpen}>
                  <DialogContent>
                    <EditSiteLinksModal
                      siteLinks={siteLinks}
                      onOpenChange={setSiteLinksEditOpen}
                      onSaved={refresh}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    router.refresh();
                  }}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
                <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">
                      <Plus className="size-4" />
                      Add project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <AddProjectModal
                      onOpenChange={setAddProjectOpen}
                      onAdded={refresh}
                    />
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                {siteLinks.linkedinUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={siteLinks.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn profile"
                    >
                      <Linkedin className="size-4" />
                      LinkedIn
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Linkedin className="size-4" />
                    LinkedIn
                  </Button>
                )}
                {siteLinks.githubUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={siteLinks.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub profile"
                    >
                      <Github className="size-4" />
                      Github
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Github className="size-4" />
                    Github
                  </Button>
                )}
              </>
            )}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity"
                  aria-label="Open settings"
                >
                  <Settings className="size-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <SettingsModal
                  initialLoggedIn={initialLoggedIn}
                  onOpenChange={setSettingsOpen}
                />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="w-full min-w-0">
            <Input
              type="search"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-none"
              aria-label="Search projects"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="flex rounded-full bg-muted p-1"
              role="tablist"
              aria-label="View mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`inline-flex size-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
                className={`inline-flex size-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  viewMode === "cards"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Cards view"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
            <div
              className="flex rounded-full bg-muted p-1"
              role="tablist"
              aria-label="Sort order"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "default"}
                onClick={() => setSortBy("default")}
                className={`inline-flex size-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  sortBy === "default"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Default order"
                title="Default order"
              >
                <ListOrdered className="size-4" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "asc"}
                onClick={() => setSortBy("asc")}
                className={`inline-flex size-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  sortBy === "asc"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="A to Z"
                title="A to Z"
              >
                <ArrowUpNarrowWide className="size-4" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "desc"}
                onClick={() => setSortBy("desc")}
                className={`inline-flex size-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  sortBy === "desc"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Z to A"
                title="Z to A"
              >
                <ArrowDownNarrowWide className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "cards" ? (
          <section className="grid gap-6 sm:grid-cols-2">
            {displayList.length === 0 ? (
              <p className="text-muted-foreground text-sm col-span-full">
                No projects match your search.
              </p>
            ) : (
              displayList.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isEditMode={isEditMode}
                  onDeleted={refresh}
                  onEdited={refresh}
                />
              ))
            )}
          </section>
        ) : (
          <section>
            {displayList.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No projects match your search.
              </p>
            ) : isEditMode && sortBy === "default" ? (
              <DndContext
                sensors={dndSensors}
                onDragEnd={async (event: DragEndEvent) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const ids = displayList.map((p) => p.id);
                  const oldIndex = ids.indexOf(active.id as string);
                  const newIndex = ids.indexOf(over.id as string);
                  if (oldIndex === -1 || newIndex === -1) return;
                  const newOrderedIds = arrayMove(ids, oldIndex, newIndex);
                  const result = await reorderProjects(newOrderedIds);
                  if (result.success) refresh();
                  else alert(result.error);
                }}
              >
                <SortableContext
                  items={displayList.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border">
                    {displayList.map((project) => (
                      <SortableProjectListRow
                        key={project.id}
                        project={project}
                        isEditMode={isEditMode}
                        onDeleted={refresh}
                        onEdited={refresh}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="divide-y divide-border">
                {displayList.map((project) => (
                  <ProjectListRow
                    key={project.id}
                    project={project}
                    isEditMode={isEditMode}
                    onDeleted={refresh}
                    onEdited={refresh}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
