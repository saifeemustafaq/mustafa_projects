"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, logout, type LoginResult } from "@/app/actions/auth";
import {
  updateSiteLinks,
  type UpdateSiteLinksResult,
} from "@/app/actions/site-links";
import type { SiteLinks } from "@/lib/models/SiteLinks";

export function EditSiteLinksModal({
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

export function SettingsModal({
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
