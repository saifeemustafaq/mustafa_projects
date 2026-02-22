import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, ArrowRight } from "lucide-react";

export default function StylePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-12">
        {/* Page title */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Design guide
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-[65ch]">
            Reference for typography, color, spacing, and components. Use this
            page to see how things look in the portfolio.
          </p>
        </header>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Typography</h2>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Page title · text-2xl font-semibold
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                Portfolio title
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Section title · text-lg font-semibold
              </p>
              <p className="text-lg font-semibold">Section title</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Card title · text-base font-semibold
              </p>
              <p className="text-base font-semibold">Project name</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Body · default
              </p>
              <p className="text-foreground max-w-[65ch]">
                Body text uses the default size and foreground color. Keep line
                length around 65–75 characters for readability.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Muted · text-muted-foreground text-sm
              </p>
              <p className="text-muted-foreground text-sm">
                Use for descriptions, dates, and secondary info.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Mono · font-mono text-sm
              </p>
              <p className="font-mono text-sm text-foreground">
                npm run dev · next.config.ts
              </p>
            </div>
          </div>
        </section>

        {/* Color */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Color</h2>
          <p className="text-muted-foreground text-sm max-w-[65ch]">
            Semantic tokens only. No raw hex; use theme variables.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { name: "Background", class: "bg-background border border-border" },
              { name: "Card", class: "bg-card border border-border" },
              { name: "Muted", class: "bg-muted text-muted-foreground" },
              { name: "Primary", class: "bg-primary text-primary-foreground" },
              {
                name: "Secondary",
                class: "bg-secondary text-secondary-foreground",
              },
              {
                name: "Destructive",
                class: "bg-destructive text-destructive-foreground",
              },
            ].map(({ name, class: className }) => (
              <div
                key={name}
                className={`rounded-lg p-4 text-sm font-medium ${className}`}
              >
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Buttons</h2>
          <div className="space-y-6 rounded-lg border border-border bg-card p-6">
            <div>
              <p className="text-muted-foreground text-sm mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Icon only">
                  <ArrowRight />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-3">
                With icon (e.g. external link)
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  View project
                  <ExternalLink className="size-4" />
                </Button>
                <Button variant="outline">
                  <Github className="size-4" />
                  Source code
                </Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-3">Disabled</p>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* Card — project block example */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Card (project block)</h2>
          <p className="text-muted-foreground text-sm max-w-[65ch]">
            Use Card, CardHeader, CardTitle, CardDescription, CardContent,
            CardFooter for project blocks. Keep structure consistent.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project name</CardTitle>
                <CardDescription>
                  Short description in one or two sentences. Muted text for
                  secondary info.
                </CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#">
                      View project
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Optional extra content or tech tags could go here.
                </p>
              </CardContent>
              <CardFooter className="border-t border-border">
                <span className="text-muted-foreground text-xs">
                  Next.js · TypeScript · Tailwind
                </span>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Another project</CardTitle>
                <CardDescription>
                  Same card structure. Consistent layout across all project
                  cards.
                </CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm">
                    Learn more
                  </Button>
                </CardAction>
              </CardHeader>
              <CardFooter className="border-t border-border">
                <span className="text-muted-foreground text-xs">React</span>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="rounded-lg border border-border bg-card p-6 space-y-3">
            <p className="text-muted-foreground text-sm">
              Use Button with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">asChild</code> and{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">variant=&quot;link&quot;</code> for
              text links, or outline for external actions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="link" asChild>
                <Link href="/">Back to home</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
                  Shadcn docs
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Spacing</h2>
          <p className="text-muted-foreground text-sm max-w-[65ch]">
            Section spacing: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">space-y-12</code>.
            Card grid: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">gap-6</code>.
            Container: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">max-w-4xl</code>.
          </p>
          <div className="flex gap-6 rounded-lg border border-border bg-card p-6">
            <div className="h-16 w-16 rounded-md bg-muted" title="gap-4 block" />
            <div className="h-16 w-16 rounded-md bg-muted" title="gap-4 block" />
            <div className="h-16 w-16 rounded-md bg-muted" title="gap-4 block" />
          </div>
        </section>

        <footer className="pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            Design guide · Portfolio style system
          </p>
        </footer>
      </div>
    </div>
  );
}
