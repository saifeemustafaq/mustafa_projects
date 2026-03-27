import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";

const experienceSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  company: { type: String, default: "" },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 },
});

const aboutInfoSchema = new mongoose.Schema(
  {
    photoUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    experiences: { type: [experienceSchema], default: [] },
  },
  { timestamps: true }
);

export const AboutInfoModel =
  mongoose.models.AboutInfo ?? mongoose.model("AboutInfo", aboutInfoSchema);

export type Experience = {
  id: string;
  company: string;
  content: string;
  order: number;
};

export type AboutInfo = {
  photoUrl: string;
  description: string;
  experiences: Experience[];
};

export async function getAboutInfo(): Promise<AboutInfo> {
  await connectDb();
  const doc = await AboutInfoModel.findOne().lean<{
    photoUrl?: string;
    description?: string;
    experiences?: Array<{ id?: string; company?: string; content?: string; order?: number }>;
  }>();
  const exps = (doc?.experiences ?? []).map((e) => ({
    id: e.id ?? "",
    company: e.company ?? "",
    content: e.content ?? "",
    order: e.order ?? 0,
  }));
  exps.sort((a, b) => a.order - b.order);
  return {
    photoUrl: doc?.photoUrl ?? "",
    description: doc?.description ?? "",
    experiences: exps,
  };
}

export async function updateAboutInfo(
  photoUrl: string,
  description: string
): Promise<void> {
  await connectDb();
  await AboutInfoModel.findOneAndUpdate(
    {},
    { $set: { photoUrl: photoUrl.trim(), description: description.trim() } },
    { upsert: true }
  );
}

export async function addExperience(
  company: string,
  content: string
): Promise<void> {
  await connectDb();
  const doc = await AboutInfoModel.findOne().lean<{
    experiences?: Array<{ order?: number }>;
  }>();
  const maxOrder =
    doc?.experiences && doc.experiences.length > 0
      ? Math.max(...doc.experiences.map((e) => e.order ?? 0))
      : -1;
  await AboutInfoModel.findOneAndUpdate(
    {},
    {
      $push: {
        experiences: {
          id: crypto.randomUUID(),
          company: company.trim(),
          content: content.trim(),
          order: maxOrder + 1,
        },
      },
    },
    { upsert: true }
  );
}

export async function updateExperience(
  id: string,
  company: string,
  content: string
): Promise<void> {
  await connectDb();
  await AboutInfoModel.findOneAndUpdate(
    { "experiences.id": id },
    {
      $set: {
        "experiences.$.company": company.trim(),
        "experiences.$.content": content.trim(),
      },
    }
  );
}

export async function deleteExperience(id: string): Promise<void> {
  await connectDb();
  await AboutInfoModel.findOneAndUpdate({}, { $pull: { experiences: { id } } });
}

export async function reorderExperiencesById(orderedIds: string[]): Promise<boolean> {
  if (!orderedIds.length) return true;
  await connectDb();
  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        AboutInfoModel.updateOne(
          { "experiences.id": id },
          { $set: { "experiences.$.order": index } }
        )
      )
    );
    return true;
  } catch {
    return false;
  }
}
