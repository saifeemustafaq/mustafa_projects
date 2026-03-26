"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Presentation,
  Github,
  ExternalLink,
  Trash2,
  Pencil,
  GripVertical,
} from "lucide-react";
import type { Project } from "@/lib/models/Project";
import { deleteProject } from "@/app/actions/projects";
import { detectPrdUrlType } from "@/lib/prd-utils";
import { PRDViewerDialog } from "@/components/prd-viewer-dialog";
import { EditProjectModal } from "@/app/project-form-modals";

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

export function ProjectCard({
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
              <DialogContent className="max-w-3xl w-[90vw]">
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

export function ProjectListRow({
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
              <DialogContent className="max-w-3xl w-[90vw]">
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

export function SortableProjectListRow({
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
