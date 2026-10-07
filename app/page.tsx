"use client";

import { useLanguage } from "./language";
import { siteCopy } from "./portfolio-content";
import SiteHeader from "./site-header";
import { HomeSection, ResearchSection, ProjectSection, AwardsSection, LifeSection } from "./portfolio-sections";

/** Composition only: content, preferences, gestures, and ambient motion are independent. */
export default function Home() {
  const language = useLanguage();
  const copy = siteCopy[language];
  return (
    <div className="site-language-root" data-language={language} lang={language === "zh" ? "zh-CN" : "en"}>
      <a className="skip-link" href="#content">{copy.skipLink}</a>
      <SiteHeader language={language} />
      <main className="portfolio-shell" id="content">
        <HomeSection language={language} />
        <ResearchSection language={language} />
        <ProjectSection language={language} />
        <AwardsSection language={language} />
        <LifeSection language={language} />
      </main>
    </div>
  );
}
