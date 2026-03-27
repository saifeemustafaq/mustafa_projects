"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/app/image-uploader";
import type { AboutInfo, Experience } from "@/lib/models/AboutInfo";
import {
  updateAboutInfo,
  addExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
} from "@/app/actions/about-info";

// ─── Sub-dialogs ──────────────────────────────────────────────────────────────

function EditBioDialog({
  photoUrl,
  description,
  onOpenChange,
  onSaved,
}: {
  photoUrl: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState(photoUrl);
  const [bio, setBio] = useState(description);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateAboutInfo(photo, bio);
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
        <DialogTitle>Edit bio</DialogTitle>
        <DialogDescription>
          Update your profile photo and short bio.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <ImageUploader
          defaultUrl={photo}
          projectName="profile"
          onValueChange={setPhoto}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short description about yourself…"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </form>
    </>
  );
}

function ExperienceFormDialog({
  title,
  initialCompany,
  initialContent,
  pending,
  error,
  onSubmit,
  onOpenChange,
}: {
  title: string;
  initialCompany: string;
  initialContent: string;
  pending: boolean;
  error: string | null;
  onSubmit: (company: string, content: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [company, setCompany] = useState(initialCompany);
  const [content, setContent] = useState(initialContent);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Company name and a description of your work there (markdown supported).
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(company, content);
        }}
        className="space-y-4 py-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Microsoft"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Work description</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you work on? Markdown is supported."
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending || !company.trim()}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}

// ─── Sortable experience button (edit mode) ───────────────────────────────────

function SortableExpButton({
  exp,
  deletePending,
  onEdit,
  onDelete,
}: {
  exp: Experience;
  deletePending: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="inline-flex size-5 cursor-grab active:cursor-grabbing items-center justify-center rounded text-muted-foreground hover:text-foreground"
        aria-label={`Drag to reorder ${exp.company}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="gap-1.5"
      >
        {exp.company}
        <Pencil className="size-3 text-muted-foreground" />
      </Button>
      <button
        type="button"
        disabled={deletePending === exp.id}
        onClick={onDelete}
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label={`Delete ${exp.company}`}
      >
        {deletePending === exp.id ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AboutSection({
  initialAboutInfo,
  isEditMode,
}: {
  initialAboutInfo: AboutInfo;
  isEditMode: boolean;
}) {
  const router = useRouter();
  const { photoUrl, description, experiences } = initialAboutInfo;
  const sortedExps = [...experiences].sort((a, b) => a.order - b.order);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Dialog open state
  const [editBioOpen, setEditBioOpen] = useState(false);
  const [viewExpId, setViewExpId] = useState<string | null>(null);
  const [editExpId, setEditExpId] = useState<string | null>(null);
  const [addExpOpen, setAddExpOpen] = useState(false);

  // Pending states
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [expFormPending, setExpFormPending] = useState(false);
  const [expFormError, setExpFormError] = useState<string | null>(null);

  const viewExp = viewExpId ? sortedExps.find((e) => e.id === viewExpId) : null;
  const editExp = editExpId ? sortedExps.find((e) => e.id === editExpId) : null;

  function refresh() {
    router.refresh();
  }

  async function handleDeleteExp(exp: Experience) {
    setDeletePending(exp.id);
    const result = await deleteExperience(exp.id);
    setDeletePending(null);
    if (result.success) refresh();
    else alert(result.error);
  }

  async function handleUpdateExp(company: string, content: string) {
    if (!editExpId) return;
    setExpFormPending(true);
    setExpFormError(null);
    const result = await updateExperience(editExpId, company, content);
    setExpFormPending(false);
    if (result.success) {
      setEditExpId(null);
      refresh();
    } else {
      setExpFormError(result.error);
    }
  }

  async function handleAddExp(company: string, content: string) {
    setExpFormPending(true);
    setExpFormError(null);
    const result = await addExperience(company, content);
    setExpFormPending(false);
    if (result.success) {
      setAddExpOpen(false);
      refresh();
    } else {
      setExpFormError(result.error);
    }
  }

  // Don't render anything in public mode if there's no content yet
  const hasContent = photoUrl || description || sortedExps.length > 0;
  if (!hasContent && !isEditMode) return null;

  return (
    <section className="space-y-4">
      {/* Photo + bio row */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Profile photo"
            className="size-20 rounded-full object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          {description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : isEditMode ? (
            <p className="text-sm text-muted-foreground italic">
              No bio yet — click &ldquo;Edit bio&rdquo; to add one.
            </p>
          ) : null}
        </div>
        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditBioOpen(true)}
            className="shrink-0"
          >
            <Pencil className="size-4" />
            Edit bio
          </Button>
        )}
      </div>

      {/* Experience buttons */}
      {(sortedExps.length > 0 || isEditMode) && (
        <div className="flex flex-wrap items-center gap-2">
          {isEditMode ? (
            <DndContext
              sensors={dndSensors}
              onDragEnd={async (event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const ids = sortedExps.map((e) => e.id);
                const oldIndex = ids.indexOf(active.id as string);
                const newIndex = ids.indexOf(over.id as string);
                if (oldIndex === -1 || newIndex === -1) return;
                const newOrderedIds = arrayMove(ids, oldIndex, newIndex);
                const result = await reorderExperiences(newOrderedIds);
                if (result.success) refresh();
                else alert(result.error);
              }}
            >
              <SortableContext
                items={sortedExps.map((e) => e.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {sortedExps.map((exp) => (
                    <SortableExpButton
                      key={exp.id}
                      exp={exp}
                      deletePending={deletePending}
                      onEdit={() => setEditExpId(exp.id)}
                      onDelete={() => handleDeleteExp(exp)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            sortedExps.map((exp) => (
              <Button
                key={exp.id}
                variant="outline"
                size="sm"
                onClick={() => setViewExpId(exp.id)}
              >
                {exp.company}
              </Button>
            ))
          )}
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExpFormError(null);
                setAddExpOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add experience
            </Button>
          )}
        </div>
      )}

      {/* View experience dialog (public) */}
      <Dialog
        open={viewExpId !== null}
        onOpenChange={(open) => !open && setViewExpId(null)}
      >
        {viewExp && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewExp.company}</DialogTitle>
              <DialogDescription>Work experience</DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewExp.content || "_No details provided._"}
              </ReactMarkdown>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit bio dialog */}
      <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
        <DialogContent className="max-w-lg">
          <EditBioDialog
            photoUrl={photoUrl}
            description={description}
            onOpenChange={setEditBioOpen}
            onSaved={refresh}
          />
        </DialogContent>
      </Dialog>

      {/* Edit experience dialog */}
      <Dialog
        open={editExpId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditExpId(null);
            setExpFormError(null);
          }
        }}
      >
        {editExp && (
          <DialogContent className="max-w-lg">
            <ExperienceFormDialog
              key={editExp.id}
              title={`Edit — ${editExp.company}`}
              initialCompany={editExp.company}
              initialContent={editExp.content}
              pending={expFormPending}
              error={expFormError}
              onSubmit={handleUpdateExp}
              onOpenChange={(open) => {
                if (!open) {
                  setEditExpId(null);
                  setExpFormError(null);
                }
              }}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Add experience dialog */}
      <Dialog
        open={addExpOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddExpOpen(false);
            setExpFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <ExperienceFormDialog
            key={addExpOpen ? "add-open" : "add-closed"}
            title="Add experience"
            initialCompany=""
            initialContent=""
            pending={expFormPending}
            error={expFormError}
            onSubmit={handleAddExp}
            onOpenChange={(open) => {
              if (!open) {
                setAddExpOpen(false);
                setExpFormError(null);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
