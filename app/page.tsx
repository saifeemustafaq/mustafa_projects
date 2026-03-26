import { getProjects, seedDummyProjects } from "@/lib/models/Project";
import { getSiteLinks } from "@/lib/models/SiteLinks";
import { getAboutInfo } from "@/lib/models/AboutInfo";
import { getSession } from "@/lib/auth";
import { LandingContent } from "./landing-content";

export default async function Home() {
  const [session, projects, siteLinks, aboutInfo] = await Promise.all([
    getSession(),
    (async () => {
      let p = await getProjects();
      if (p.length === 0) {
        await seedDummyProjects();
        p = await getProjects();
      }
      return p;
    })(),
    getSiteLinks(),
    getAboutInfo(),
  ]);

  return (
    <LandingContent
      initialProjects={projects}
      initialLoggedIn={!!session}
      initialSiteLinks={siteLinks}
      initialAboutInfo={aboutInfo}
    />
  );
}
