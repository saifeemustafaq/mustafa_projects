"use client";

import { useState } from "react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/models/Project";
import {
  createProject,
  updateProject,
  type CreateProjectResult,
  type UpdateProjectResult,
} from "@/app/actions/projects";
import { ImageUploader } from "@/app/image-uploader";

const TEXTAREA_CLASS =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50";

function ProjectUrlField({
  idPrefix,
  urlName,
  label,
  defaultUrl,
  defaultEnabled,
}: {
  idPrefix: string;
  urlName: string;
  label: string;
  defaultUrl?: string;
  defaultEnabled?: boolean;
}) {
  const fieldId = urlName.replace("Url", "");
  const enableName = `${fieldId}Enabled`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${idPrefix}-${fieldId}`} className="text-sm font-medium">
          {label} (optional)
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            id={`${idPrefix}-${fieldId}-enable`}
            name={enableName}
            defaultChecked={defaultEnabled ?? true}
            className="size-4 rounded border-input"
          />
          Enable
        </label>
      </div>
      <Input
        id={`${idPrefix}-${fieldId}`}
        name={urlName}
        type="url"
        defaultValue={defaultUrl}
        placeholder="https://..."
      />
    </div>
  );
}

export function AddProjectModal({
  onOpenChange,
  onAdded,
}: {
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

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
      setImageUrl("");
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
      <form onSubmit={handleSubmit} className="py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4">
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
                className={TEXTAREA_CLASS}
              />
            </div>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <ImageUploader onValueChange={setImageUrl} />
          </div>
          <div className="space-y-4">
            <ProjectUrlField idPrefix="add" urlName="prdUrl" label="PRD URL" />
            <ProjectUrlField idPrefix="add" urlName="pptUrl" label="PPT URL" />
            <ProjectUrlField idPrefix="add" urlName="githubUrl" label="GitHub URL" />
            <ProjectUrlField idPrefix="add" urlName="demoUrl" label="Demo URL" />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-4">
          {pending ? "Adding…" : "Add project"}
        </Button>
      </form>
    </>
  );
}

export function EditProjectModal({
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
  const [imageUrl, setImageUrl] = useState(project.imageUrl);

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
      <form onSubmit={handleSubmit} className="py-4">
        <input type="hidden" name="projectId" value={project.id} readOnly />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4">
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
                className={TEXTAREA_CLASS}
              />
            </div>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <ImageUploader
              defaultUrl={project.imageUrl}
              projectName={project.name}
              onValueChange={setImageUrl}
            />
          </div>
          <div className="space-y-4">
            <ProjectUrlField idPrefix="edit" urlName="prdUrl" label="PRD URL" defaultUrl={project.prdUrl} defaultEnabled={project.prdEnabled} />
            <ProjectUrlField idPrefix="edit" urlName="pptUrl" label="PPT URL" defaultUrl={project.pptUrl} defaultEnabled={project.pptEnabled} />
            <ProjectUrlField idPrefix="edit" urlName="githubUrl" label="GitHub URL" defaultUrl={project.githubUrl} defaultEnabled={project.githubEnabled} />
            <ProjectUrlField idPrefix="edit" urlName="demoUrl" label="Demo URL" defaultUrl={project.demoUrl} defaultEnabled={project.demoEnabled} />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-4">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </>
  );
}
