import SectionSwitcher from "./section-switcher";
import AmbientMotionControl from "./ambient-motion";
import { siteCopy, type Language } from "./portfolio-content";
import { setLanguagePreference } from "./language";

export default function SiteHeader({ language }: { language: Language }) {
  const copy = siteCopy[language];
  const nextLanguage: Language = language === "en" ? "zh" : "en";
  return (
<header className="site-header">
        <div className="site-header-layout">
          <button
            className="language-toggle"
            type="button"
            aria-label={copy.switchLanguage}
            onClick={() => setLanguagePreference(nextLanguage)}
          >
            <span className={`language-option${language === "zh" ? " is-active" : ""}`} lang="zh-CN">
              中
            </span>
            <span className="language-divider" aria-hidden="true">
              /
            </span>
            <span className={`language-option${language === "en" ? " is-active" : ""}`} lang="en">
              EN
            </span>
          </button>

          <div className="site-header-inner">
            <SectionSwitcher labels={copy.navigation} ariaLabel={copy.navigationLabel} />
          </div>

          <AmbientMotionControl labels={copy.motion} />
        </div>
      </header>
  );
}
