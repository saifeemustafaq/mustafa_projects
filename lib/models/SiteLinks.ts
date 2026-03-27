import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";

const siteLinksSchema = new mongoose.Schema(
  {
    linkedinUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactLocation: { type: String, default: "" },
  },
  { timestamps: true }
);

// Always delete the cached model so schema changes take effect on hot reloads.
// Safe in production too: the module only loads once per server start.
delete (mongoose.models as Record<string, unknown>).SiteLinks;
export const SiteLinksModel = mongoose.model("SiteLinks", siteLinksSchema);

export type SiteLinks = {
  linkedinUrl: string;
  githubUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
};

export async function getSiteLinks(): Promise<SiteLinks> {
  await connectDb();
  const doc = await SiteLinksModel.findOne().lean();
  return {
    linkedinUrl: doc?.linkedinUrl ?? "",
    githubUrl: doc?.githubUrl ?? "",
    contactEmail: doc?.contactEmail ?? "",
    contactPhone: doc?.contactPhone ?? "",
    contactLocation: doc?.contactLocation ?? "",
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
        ...(links.contactEmail !== undefined && { contactEmail: links.contactEmail }),
        ...(links.contactPhone !== undefined && { contactPhone: links.contactPhone }),
        ...(links.contactLocation !== undefined && { contactLocation: links.contactLocation }),
      },
    },
    { new: true, upsert: true }
  ).lean();
  return {
    linkedinUrl: doc?.linkedinUrl ?? "",
    githubUrl: doc?.githubUrl ?? "",
    contactEmail: doc?.contactEmail ?? "",
    contactPhone: doc?.contactPhone ?? "",
    contactLocation: doc?.contactLocation ?? "",
  };
}
