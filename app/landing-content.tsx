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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Presentation,
  Github,
  ExternalLink,
  Settings,
  Plus,
  Trash2,
  Pencil,
  LogOut,
  List,
  LayoutGrid,
  Linkedin,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  ListOrdered,
  GripVertical,
} from "lucide-react";
import type { Project } from "@/lib/models/Project";
import { login, logout, type LoginResult } from "@/app/actions/auth";
import {
  createProject,
  deleteProject,
  reorderProjects,
  updateProject,
  type CreateProjectResult,
  type UpdateProjectResult,
} from "@/app/actions/projects";
import {
  updateSiteLinks,
  type UpdateSiteLinksResult,
} from "@/app/actions/site-links";
import { detectPrdUrlType } from "@/lib/prd-utils";
import { PRDViewerDialog } from "@/components/prd-viewer-dialog";

type SiteLinks = { linkedinUrl: string; githubUrl: string };

const MAX_DESCRIPTION_LENGTH = 150;

function TruncatedDescription({
  description,
  title,
  className,
}: {
  description: string;
  title: string;
  className?: string;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  if (description.length <= MAX_DESCRIPTION_LENGTH) {
    return <span className={className}>{description}</span>;
  }
  const truncated = description.slice(0, MAX_DESCRIPTION_LENGTH);
  return (
    <>
      <span className={className}>
        {truncated}
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="cursor-pointer text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          aria-label="Read full description"
        >
          ... (read more)
        </button>
      </span>
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} (description)</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {description}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectLinkButtons({ project }: { project: Project }) {
  const [prdViewerOpen, setPrdViewerOpen] = useState(false);

  const prdIsInline =
    project.prdEnabled &&
    !!project.prdUrl &&
    detectPrdUrlType(project.prdUrl) !== "external";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="min-w-18"
        disabled={!project.prdEnabled || !project.prdUrl}
        asChild={project.prdEnabled && !!project.prdUrl && !prdIsInline}
        onClick={prdIsInline ? () => setPrdViewerOpen(true) : undefined}
      >
        {project.prdEnabled && project.prdUrl && !prdIsInline ? (
          <a href={project.prdUrl} target="_blank" rel="noopener noreferrer" aria-label="Open PRD">
            <FileText className="size-4" />
            PRD
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5"><FileText className="size-4" /> PRD</span>
        )}
      </Button>
      {prdIsInline && (
        <PRDViewerDialog
          open={prdViewerOpen}
          onOpenChange={setPrdViewerOpen}
          url={project.prdUrl}
          projectName={project.name}
        />
      )}
      <Button
        variant="outline"
        size="sm"
        className="min-w-18"
        disabled={!project.pptEnabled || !project.pptUrl}
        asChild={project.pptEnabled && !!project.pptUrl}
      >
        {project.pptEnabled && project.pptUrl ? (
          <a href={project.pptUrl} target="_blank" rel="noopener noreferrer" aria-label="Open PPT">
            <Presentation className="size-4" />
            PPT
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5"><Presentation className="size-4" /> PPT</span>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="min-w-18"
        disabled={!project.githubEnabled || !project.githubUrl}
        asChild={project.githubEnabled && !!project.githubUrl}
      >
        {project.githubEnabled && project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Open GitHub">
            <Github className="size-4" />
            GitHub
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5"><Github className="size-4" /> GitHub</span>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="min-w-18"
        disabled={!project.demoEnabled || !project.demoUrl}
        asChild={project.demoEnabled && !!project.demoUrl}
      >
        {project.demoEnabled && project.demoUrl ? (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Demo">
            <ExternalLink className="size-4" />
            Demo
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5"><ExternalLink className="size-4" /> Demo</span>
        )}
      </Button>
    </>
  );
}

function ProjectCard({
  project,
  isEditMode,
  onDeleted,
  onEdited,
}: {
  project: Project;
  isEditMode: boolean;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"?`)) return;
    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);
    if (result.success) onDeleted();
    else alert(result.error);
  }

  return (
    <Card className="min-w-0 h-full flex flex-col">
      <div className="mx-6 aspect-video overflow-hidden rounded-md shrink-0 bg-muted">
        {project.imageUrl ? (
          <>
            <button
              type="button"
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setImageOpen(true)}
              aria-label={`View full image for ${project.name}`}
            >
              <img
                src={project.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view image
                </span>
              </div>
            </button>
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
              <DialogContent className="max-w-4xl w-[90vw] p-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>{project.name}</DialogTitle>
                  <DialogDescription>Full size project image</DialogDescription>
                </DialogHeader>
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="w-full h-auto rounded-md"
                />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <CardHeader className="shrink-0">
        <CardTitle>{project.name}</CardTitle>
        <div className="max-h-28 overflow-y-auto overflow-x-hidden min-w-0">
          <CardDescription className="max-w-full min-w-0 wrap-break-word">
            <TruncatedDescription
              description={project.description}
              title={project.name}
            />
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0" />
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border shrink-0 mt-auto">
        <div className="flex flex-wrap gap-2">
          <ProjectLinkButtons project={project} />
        </div>
        {isEditMode && (
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditOpen(true)}
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="size-4" />
            </Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <EditProjectModal
                  project={project}
                  onOpenChange={setEditOpen}
                  onSaved={() => {
                    setEditOpen(false);
                    onEdited();
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function ProjectListRow({
  project,
  isEditMode,
  onDeleted,
  onEdited,
  dragHandle,
}: {
  project: Project;
  isEditMode: boolean;
  onDeleted: () => void;
  onEdited: () => void;
  dragHandle?: React.ReactNode;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"?`)) return;
    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);
    if (result.success) onDeleted();
    else alert(result.error);
  }

  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {dragHandle}
        <div className="min-w-0">
          <p className="font-semibold leading-none">{project.name}</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-full min-w-0 wrap-break-word overflow-hidden">
            <TruncatedDescription
              description={project.description}
              title={project.name}
              className="text-muted-foreground text-sm"
            />
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <ProjectLinkButtons project={project} />
        {isEditMode && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditOpen(true)}
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="size-4" />
            </Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <EditProjectModal
                  project={project}
                  onOpenChange={setEditOpen}
                  onSaved={() => {
                    setEditOpen(false);
                    onEdited();
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function SortableProjectListRow({
  project,
  isEditMode,
  onDeleted,
  onEdited,
}: {
  project: Project;
  isEditMode: boolean;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      className="touch-none flex shrink-0 cursor-grab active:cursor-grabbing rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder ${project.name}`}
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50 bg-muted/50 rounded" : ""}
    >
      <ProjectListRow
        project={project}
        isEditMode={isEditMode}
        onDeleted={onDeleted}
        onEdited={onEdited}
        dragHandle={dragHandle}
      />
    </div>
  );
}

function AddProjectModal({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result: CreateProjectResult = await createProject(null, formData);
    setPending(false);
    if (result.success) {
      onAdded();
      onOpenChange(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add project</DialogTitle>
        <DialogDescription>
          Add a new project. Name and description are required.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="add-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="add-name"
            name="name"
            required
            placeholder="Project name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="add-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="add-description"
            name="description"
            required
            placeholder="Short description"
            rows={3}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="add-imageUrl" className="text-sm font-medium">
            Image URL (optional)
          </label>
          <Input
            id="add-imageUrl"
            name="imageUrl"
            type="text"
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">16:9 project snapshot.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="add-prd" className="text-sm font-medium">
              PRD URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="add-prd-enable"
                name="prdEnabled"
                defaultChecked
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="add-prd" name="prdUrl" type="url" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="add-ppt" className="text-sm font-medium">
              PPT URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="add-ppt-enable"
                name="pptEnabled"
                defaultChecked
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="add-ppt" name="pptUrl" type="url" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="add-github" className="text-sm font-medium">
              GitHub URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="add-github-enable"
                name="githubEnabled"
                defaultChecked
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="add-github" name="githubUrl" type="url" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="add-demo" className="text-sm font-medium">
              Demo URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="add-demo-enable"
                name="demoEnabled"
                defaultChecked
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="add-demo" name="demoUrl" type="url" placeholder="https://..." />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add project"}
        </Button>
      </form>
    </>
  );
}

function EditProjectModal({
  project,
  onOpenChange,
  onSaved,
}: {
  project: Project;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result: UpdateProjectResult = await updateProject(null, formData);
    setPending(false);
    if (result.success) {
      onSaved();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit project</DialogTitle>
        <DialogDescription>Update the project details.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <input type="hidden" name="projectId" value={project.id} readOnly />
        <div className="space-y-2">
          <label htmlFor="edit-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="edit-name"
            name="name"
            required
            defaultValue={project.name}
            placeholder="Project name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="edit-description"
            name="description"
            required
            defaultValue={project.description}
            placeholder="Short description"
            rows={3}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-imageUrl" className="text-sm font-medium">
            Image URL (optional)
          </label>
          <Input
            id="edit-imageUrl"
            name="imageUrl"
            type="text"
            defaultValue={project.imageUrl}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">16:9 project snapshot.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="edit-prd" className="text-sm font-medium">
              PRD URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="edit-prd-enable"
                name="prdEnabled"
                defaultChecked={project.prdEnabled}
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="edit-prd" name="prdUrl" type="url" defaultValue={project.prdUrl} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="edit-ppt" className="text-sm font-medium">
              PPT URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="edit-ppt-enable"
                name="pptEnabled"
                defaultChecked={project.pptEnabled}
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="edit-ppt" name="pptUrl" type="url" defaultValue={project.pptUrl} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="edit-github" className="text-sm font-medium">
              GitHub URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="edit-github-enable"
                name="githubEnabled"
                defaultChecked={project.githubEnabled}
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="edit-github" name="githubUrl" type="url" defaultValue={project.githubUrl} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="edit-demo" className="text-sm font-medium">
              Demo URL (optional)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="edit-demo-enable"
                name="demoEnabled"
                defaultChecked={project.demoEnabled}
                className="size-4 rounded border-input"
              />
              Enable
            </label>
          </div>
          <Input id="edit-demo" name="demoUrl" type="url" defaultValue={project.demoUrl} placeholder="https://..." />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </>
  );
}

function EditSiteLinksModal({
  siteLinks,
  onOpenChange,
  onSaved,
}: {
  siteLinks: SiteLinks;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState(siteLinks.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(siteLinks.githubUrl);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result: UpdateSiteLinksResult = await updateSiteLinks(linkedinUrl, githubUrl);
    setPending(false);
    if (result.success) {
      onSaved();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit profile links</DialogTitle>
        <DialogDescription>
          Set your LinkedIn and GitHub profile URLs. They appear below the site title.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="edit-linkedin" className="text-sm font-medium">
            LinkedIn URL
          </label>
          <Input
            id="edit-linkedin"
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-github" className="text-sm font-medium">
            GitHub URL
          </label>
          <Input
            id="edit-github"
            type="url"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </>
  );
}

function SettingsModal({
  initialLoggedIn,
  onOpenChange,
}: {
  initialLoggedIn: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
  }, [initialLoggedIn]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result: LoginResult = await login(null, formData);
    setPending(false);
    if (result.success) {
      setLoggedIn(true);
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleLogout() {
    await logout();
    setLoggedIn(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>Login to access admin features.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {loggedIn ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">You are logged in.</p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-username" className="text-sm font-medium">
                Login
              </label>
              <Input
                id="settings-username"
                name="username"
                type="text"
                placeholder="Username"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="settings-password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}

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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-lg font-semibold text-foreground hover:text-foreground/90 transition-colors"
              >
                Mustafa&apos;s AI projects
              </Link>
              {isEditMode && (
                <span
                  className="font-bold uppercase text-red-600 dark:text-red-400"
                  aria-label="Edit mode is on"
                >
                  EDIT MODE
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <>
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
                      open={addProjectOpen}
                      onOpenChange={setAddProjectOpen}
                      onAdded={refresh}
                    />
                  </DialogContent>
                </Dialog>
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

        <div className="flex flex-wrap items-start gap-8 border-y border-border py-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Work Experience
            </span>
            <div className="flex items-center gap-3">
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
                  className="size-8 rounded-md object-contain"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block self-center" />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Education
            </span>
            <div className="flex items-center gap-3">
              <img
                src="https://img.logo.dev/cmu.edu?token=pk_TpV6cBsNRw6eLkvygVgOkQ&size=64&format=png"
                alt="Carnegie Mellon University"
                title="Carnegie Mellon University"
                className="size-8 rounded-md object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>

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
