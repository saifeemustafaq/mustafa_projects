import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";

const siteLinksSchema = new mongoose.Schema(
  {
    linkedinUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SiteLinksModel =
  mongoose.models.SiteLinks ?? mongoose.model("SiteLinks", siteLinksSchema);

export type SiteLinks = {
  linkedinUrl: string;
  githubUrl: string;
};

export async function getSiteLinks(): Promise<SiteLinks> {
  await connectDb();
  const doc = await SiteLinksModel.findOne().lean();
  return {
    linkedinUrl: doc?.linkedinUrl ?? "",
    githubUrl: doc?.githubUrl ?? "",
  };
}

export async function updateSiteLinks(links: Partial<SiteLinks>): Promise<SiteLinks> {
  await connectDb();
  const doc = await SiteLinksModel.findOneAndUpdate(
    {},
    {
      $set: {
        ...(links.linkedinUrl !== undefined && { linkedinUrl: links.linkedinUrl }),
        ...(links.githubUrl !== undefined && { githubUrl: links.githubUrl }),
      },
    },
    { new: true, upsert: true }
  ).lean();
  return {
    linkedinUrl: doc?.linkedinUrl ?? "",
    githubUrl: doc?.githubUrl ?? "",
  };
}
