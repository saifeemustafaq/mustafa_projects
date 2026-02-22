import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    prdUrl: { type: String, default: "" },
    pptUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    prdEnabled: { type: Boolean, default: true },
    pptEnabled: { type: Boolean, default: true },
    githubEnabled: { type: Boolean, default: true },
    demoEnabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProjectModel =
  mongoose.models.Project ?? mongoose.model("Project", projectSchema);

export type ProjectDoc = mongoose.InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  prdUrl: string;
  pptUrl: string;
  githubUrl: string;
  demoUrl: string;
  prdEnabled: boolean;
  pptEnabled: boolean;
  githubEnabled: boolean;
  demoEnabled: boolean;
  order: number;
};

export async function getProjects(): Promise<Project[]> {
  await connectDb();
  const docs = await ProjectModel.find().sort({ order: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl ?? "",
    prdUrl: d.prdUrl ?? "",
    pptUrl: d.pptUrl ?? "",
    githubUrl: d.githubUrl ?? "",
    demoUrl: d.demoUrl ?? "",
    prdEnabled: d.prdEnabled !== false,
    pptEnabled: d.pptEnabled !== false,
    githubEnabled: d.githubEnabled !== false,
    demoEnabled: d.demoEnabled !== false,
    order: typeof d.order === "number" ? d.order : 0,
  }));
}

const DUMMY_PROJECTS: Array<{
  name: string;
  description: string;
  imageUrl: string;
  prdUrl: string;
  pptUrl: string;
  githubUrl: string;
  demoUrl: string;
}> = [
  {
    name: "AI Tax Assistant",
    description:
      "An AI-powered assistant that helps users understand tax deductions and file returns with confidence.",
    imageUrl: "",
    prdUrl: "https://example.com/prd/tax-assistant",
    pptUrl: "https://example.com/ppt/tax-assistant",
    githubUrl: "https://github.com/example/ai-tax-assistant",
    demoUrl: "https://demo.example.com/tax-assistant",
  },
  {
    name: "Document Summarizer",
    description:
      "Summarizes long documents and PDFs using LLMs. Supports multiple languages and export formats.",
    imageUrl: "",
    prdUrl: "https://example.com/prd/doc-summarizer",
    pptUrl: "https://example.com/ppt/doc-summarizer",
    githubUrl: "https://github.com/example/doc-summarizer",
    demoUrl: "https://demo.example.com/doc-summarizer",
  },
  {
    name: "Code Review Bot",
    description:
      "Automated code review comments and suggestions powered by GPT. Integrates with GitHub and GitLab.",
    imageUrl: "",
    prdUrl: "https://example.com/prd/code-review-bot",
    pptUrl: "https://example.com/ppt/code-review-bot",
    githubUrl: "https://github.com/example/code-review-bot",
    demoUrl: "https://demo.example.com/code-review-bot",
  },
  {
    name: "Meeting Notes Generator",
    description:
      "Turns meeting transcripts into structured notes, action items, and follow-up emails.",
    imageUrl: "",
    prdUrl: "https://example.com/prd/meeting-notes",
    pptUrl: "https://example.com/ppt/meeting-notes",
    githubUrl: "https://github.com/example/meeting-notes",
    demoUrl: "https://demo.example.com/meeting-notes",
  },
];

export async function seedDummyProjects(): Promise<void> {
  await connectDb();
  const count = await ProjectModel.countDocuments();
  if (count > 0) return;
  await ProjectModel.insertMany(DUMMY_PROJECTS);
}

export type CreateProjectInput = {
  name: string;
  description: string;
  imageUrl?: string;
  prdUrl?: string;
  pptUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  prdEnabled?: boolean;
  pptEnabled?: boolean;
  githubEnabled?: boolean;
  demoEnabled?: boolean;
};

export async function createProject(input: CreateProjectInput): Promise<Project> {
  await connectDb();
  const maxOrderDoc = await ProjectModel.find().sort({ order: -1 }).limit(1).lean();
  const nextOrder = (maxOrderDoc[0]?.order ?? -1) + 1;
  const doc = await ProjectModel.create({
    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl?.trim() ?? "",
    prdUrl: input.prdUrl?.trim() ?? "",
    pptUrl: input.pptUrl?.trim() ?? "",
    githubUrl: input.githubUrl?.trim() ?? "",
    demoUrl: input.demoUrl?.trim() ?? "",
    prdEnabled: input.prdEnabled !== false,
    pptEnabled: input.pptEnabled !== false,
    githubEnabled: input.githubEnabled !== false,
    demoEnabled: input.demoEnabled !== false,
    order: nextOrder,
  });
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    imageUrl: doc.imageUrl ?? "",
    prdUrl: doc.prdUrl ?? "",
    pptUrl: doc.pptUrl ?? "",
    githubUrl: doc.githubUrl ?? "",
    demoUrl: doc.demoUrl ?? "",
    prdEnabled: doc.prdEnabled !== false,
    pptEnabled: doc.pptEnabled !== false,
    githubEnabled: doc.githubEnabled !== false,
    demoEnabled: doc.demoEnabled !== false,
    order: doc.order ?? nextOrder,
  };
}

export async function updateProject(
  id: string,
  input: CreateProjectInput
): Promise<Project | null> {
  await connectDb();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const update: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: (input.imageUrl ?? "").toString().trim(),
    prdUrl: input.prdUrl?.trim() ?? "",
    pptUrl: input.pptUrl?.trim() ?? "",
    githubUrl: input.githubUrl?.trim() ?? "",
    demoUrl: input.demoUrl?.trim() ?? "",
    prdEnabled: input.prdEnabled !== false,
    pptEnabled: input.pptEnabled !== false,
    githubEnabled: input.githubEnabled !== false,
    demoEnabled: input.demoEnabled !== false,
  };
  const doc = await ProjectModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    imageUrl: doc.imageUrl ?? "",
    prdUrl: doc.prdUrl ?? "",
    pptUrl: doc.pptUrl ?? "",
    githubUrl: doc.githubUrl ?? "",
    demoUrl: doc.demoUrl ?? "",
    prdEnabled: doc.prdEnabled !== false,
    pptEnabled: doc.pptEnabled !== false,
    githubEnabled: doc.githubEnabled !== false,
    demoEnabled: doc.demoEnabled !== false,
    order: typeof doc.order === "number" ? doc.order : 0,
  };
}

export async function reorderProject(
  projectId: string,
  direction: "up" | "down"
): Promise<boolean> {
  await connectDb();
  if (!mongoose.Types.ObjectId.isValid(projectId)) return false;
  const project = await ProjectModel.findById(projectId).lean();
  if (!project) return false;
  const currentOrder = typeof project.order === "number" ? project.order : 0;

  const neighbor = await ProjectModel.findOne(
    direction === "up"
      ? { order: { $lt: currentOrder } }
      : { order: { $gt: currentOrder } }
  )
    .sort(direction === "up" ? { order: -1 } : { order: 1 })
    .limit(1)
    .lean();

  if (!neighbor) return false;
  const neighborOrder = typeof neighbor.order === "number" ? neighbor.order : 0;

  await ProjectModel.updateOne(
    { _id: new mongoose.Types.ObjectId(projectId) },
    { $set: { order: neighborOrder } }
  );
  await ProjectModel.updateOne(
    { _id: neighbor._id },
    { $set: { order: currentOrder } }
  );
  return true;
}

/** Set project order by array of ids; each project gets order = index. */
export async function reorderProjectsById(orderedIds: string[]): Promise<boolean> {
  if (!orderedIds.length) return true;
  await connectDb();
  const validIds = orderedIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== orderedIds.length) return false;
  try {
    await Promise.all(
      validIds.map((id, index) =>
        ProjectModel.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: { order: index } }
        )
      )
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  await connectDb();
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await ProjectModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
  return result.deletedCount === 1;
}
