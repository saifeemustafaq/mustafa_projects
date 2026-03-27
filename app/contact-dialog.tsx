"use client";

import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateSiteLinks,
  type UpdateSiteLinksResult,
} from "@/app/actions/site-links";
import type { SiteLinks } from "@/lib/models/SiteLinks";

export function ContactDialog({
  siteLinks,
  isEditMode,
  onOpenChange,
  onSaved,
}: {
  siteLinks: SiteLinks;
  isEditMode: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState(siteLinks.contactEmail);
  const [contactPhone, setContactPhone] = useState(siteLinks.contactPhone);
  const [contactLocation, setContactLocation] = useState(siteLinks.contactLocation);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result: UpdateSiteLinksResult = await updateSiteLinks(
      siteLinks.linkedinUrl,
      siteLinks.githubUrl,
      contactEmail,
      contactPhone,
      contactLocation
    );
    setPending(false);
    if (result.success) {
      onSaved();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  }

  if (isEditMode) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Edit contact info</DialogTitle>
          <DialogDescription>
            Set your email, phone, and location. Shown to visitors via the Contact button.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-location" className="text-sm font-medium">
              Location
            </label>
            <Input
              id="contact-location"
              type="text"
              placeholder="San Francisco, CA"
              value={contactLocation}
              onChange={(e) => setContactLocation(e.target.value)}
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

  const hasAny = siteLinks.contactEmail || siteLinks.contactPhone || siteLinks.contactLocation;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Contact</DialogTitle>
        <DialogDescription>
          Reach out via any of the channels below.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {hasAny ? (
          <ul className="space-y-3">
            {siteLinks.contactEmail && (
              <li className="flex items-center gap-3 text-sm">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={`mailto:${siteLinks.contactEmail}`}
                  className="text-foreground hover:underline break-all"
                >
                  {siteLinks.contactEmail}
                </a>
              </li>
            )}
            {siteLinks.contactPhone && (
              <li className="flex items-center gap-3 text-sm">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={`tel:${siteLinks.contactPhone}`}
                  className="text-foreground hover:underline"
                >
                  {siteLinks.contactPhone}
                </a>
              </li>
            )}
            {siteLinks.contactLocation && (
              <li className="flex items-center gap-3 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground">{siteLinks.contactLocation}</span>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No contact info available.</p>
        )}
      </div>
    </>
  );
}
