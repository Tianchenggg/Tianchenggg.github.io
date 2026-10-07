import type { ReactNode } from "react";
import { siteCopy, orderedPublications, awards, type Language } from "./portfolio-content";
import FluidBackdrop from "./fluid-backdrop";
import LifeGallery from "./life-gallery";

function NameHighlighted({
  children,
  name,
}: {
  children: string;
  name: string;
}) {
  const pieces = children.split(name);

  return (
    <>
      {pieces.map((piece, index) => (
        <span key={`${piece}-${index}`}>
          {piece}
          {index < pieces.length - 1 ? <strong>{name}</strong> : null}
        </span>
      ))}
    </>
  );
}

function ExternalLink({
  href,
  children,
  language,
  className = "",
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  language: Language;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel}>
      <span className="link-label">{children}</span>
      <span className="link-arrow" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only">{siteCopy[language].opensInNewTab}</span>
    </a>
  );
}

export function HomeSection({ language }: { language: Language }) {
  const copy = siteCopy[language];
  return (
        <section className="hero section-pad" id="home">
          <FluidBackdrop variant="hero" />
          <div className="hero-copy">
            <p className="hero-eyebrow">{copy.role}</p>
            <h1>
              {language === "en" ? (
                <>
                  Tiancheng <span>He</span>
                </>
              ) : (
                copy.name
              )}
            </h1>
            <p className="hero-statement">{copy.statement}</p>
            <div className="hero-focus-block">
              <span className="hero-focus-label">{copy.focusLabel}</span>
              <p className="hero-focus-values">
                <strong className="focus-creativity"><span>{copy.creativityAgent}</span><span className="creativity-spectrum">{copy.creativity}</span></strong>
                <strong>{copy.postTraining}</strong>
                <strong>{copy.interpretability}</strong>
              </p>
            </div>
          </div>

          <figure className="hero-portrait">
            <img
              src="/images/tiancheng-he-portrait-800.webp"
              alt={copy.portraitAlt}
              width="800"
              height="1000"
              decoding="async"
              fetchPriority="high"
            />
          </figure>

          <div className="hero-info-rail">
            <div className="hero-affiliations" role="group" aria-label={copy.affiliationsLabel}>
              <div className="affiliation-item">
                <span className="identity-icon identity-icon--school" aria-hidden="true">
                  <img src="/brand/bupt-seal.jpg" alt="" width="32" height="32" />
                </span>
                <span className="affiliation-copy">
                  <strong>{copy.bupt}</strong>
                  <small>{copy.undergraduate}</small>
                </span>
              </div>
              <div className="affiliation-item">
                <span className="identity-icon identity-icon--school" aria-hidden="true">
                  <img src="/brand/hust-seal.jpg" alt="" width="32" height="32" />
                </span>
                <span className="affiliation-copy">
                  <strong>{copy.hust}</strong>
                  <small>{copy.masters}</small>
                </span>
              </div>
            </div>

            <nav className="hero-profiles" aria-label={copy.profilesLabel}>
              <ExternalLink
                className="profile-link profile-huggingface"
                href="https://huggingface.co/htcwang"
                language={language}
              >
                <span className="identity-icon identity-icon--huggingface" aria-hidden="true">
                  <img
                    className="profile-logo profile-huggingface-logo"
                    src="/brand/huggingface.svg"
                    alt=""
                    width="32"
                    height="32"
                  />
                </span>
                <span>Hugging Face</span>
              </ExternalLink>
              <ExternalLink
                className="profile-link profile-github"
                href="https://github.com/Tianchenggg"
                language={language}
              >
                <span className="identity-icon identity-icon--github" aria-hidden="true">
                  <img
                    className="profile-logo profile-github-logo"
                    src="/brand/github-mark.svg"
                    alt=""
                    width="23"
                    height="23"
                  />
                </span>
                <span>GitHub</span>
              </ExternalLink>
            </nav>

            <div className="contact-links" role="group" aria-label={copy.contactLabel}>
              <a className="contact-email" href="mailto:tianchenghe77bupt@gmail.com">
                <span className="identity-icon contact-icon contact-icon--email" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" focusable="false">
                    <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="contact-text">tianchenghe77bupt@gmail.com</span>
              </a>
              <span className="contact-wechat">
                <span className="identity-icon contact-icon contact-icon--wechat" aria-hidden="true">
                  <img src="/brand/wechat.svg" width="20" height="20" alt="" />
                </span>
                <span className="contact-text">{copy.wechat}<span className="contact-separator" aria-hidden="true"> · </span><span className="contact-handle">Tancyne</span></span>
              </span>
            </div>
          </div>
        </section>
  );
}

export function ResearchSection({ language }: { language: Language }) {
  const copy = siteCopy[language];
  return (
        <section className="research section-pad" id="research">
          <div className="section-heading">
            <h2>{copy.researchHeading}</h2>
          </div>

          <div className="publication-grid">
            {orderedPublications.map((publication) => {
              const publicationTitle = publication.title[language];

              return (
                <article
                  className="publication-card"
                  data-venue={publication.venue.split(" ")[0]}
                  key={publication.title.en}
                >
                  <FluidBackdrop />
                  <figure className="publication-visual">
                    <img
                      src={publication.image}
                      alt={publication.imageAlt[language]}
                      width={publication.imageWidth}
                      height={publication.imageHeight}
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                  <div className="publication-body">
                    <div className="publication-meta">
                      <time dateTime={publication.dateTime}>{publication.date[language]}</time>
                      <span>{publication.venue}</span>
                    </div>
                    <div className="publication-copy">
                      <h3>{publicationTitle}</h3>
                      <p className="publication-authors">
                        <NameHighlighted name={copy.name}>
                          {publication.authors[language]}
                        </NameHighlighted>
                      </p>
                      <p className="publication-summary">{publication.summary[language]}</p>
                    </div>
                    <div
                      className="publication-links"
                      aria-label={
                        language === "zh"
                          ? `《${publicationTitle}》的相关链接`
                          : `Links for ${publicationTitle}`
                      }
                    >
                      {publication.links.map((link) => (
                        <ExternalLink href={link.href} language={language} key={link.href}>
                          {link.label[language]}
                        </ExternalLink>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
  );
}

export function ProjectSection({ language }: { language: Language }) {
  const copy = siteCopy[language];
  return (
        <section className="project-section section-pad" id="project" aria-labelledby="project-heading">
          <div className="section-heading">
            <h2 id="project-heading">{copy.projectHeading}</h2>
          </div>
          <article className="project-card" aria-labelledby="hot100-title">
            <div className="project-preview">
              <img
                src="/images/project-hot100-preview.jpg"
                alt={copy.projectImageAlt}
                width="1280"
                height="720"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="project-details">
              <h3 id="hot100-title">Hot 100 Python</h3>
              <p>{copy.projectSummary}</p>
              <ul className="project-features">
                {copy.projectFeatures.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <div className="project-actions">
                <a className="project-action" href="https://hot100-python.htcafasfadf.chatgpt.site/" target="_blank" rel="noreferrer">
                  {copy.projectDemo}<span className="sr-only">{copy.opensInNewTab}</span>
                </a>
                <a className="project-action project-action--secondary" href="https://github.com/Tianchenggg/hot100-python" target="_blank" rel="noreferrer">
                  <img src="/brand/github-mark.svg" alt="" width="18" height="18" aria-hidden="true" />
                  {copy.projectCode}<span className="sr-only">{copy.opensInNewTab}</span>
                </a>
              </div>
            </div>
          </article>
        </section>
  );
}

export function AwardsSection({ language }: { language: Language }) {
  const copy = siteCopy[language];
  return (
        <section
          className="awards-section section-pad"
          id="awards"
          aria-labelledby="awards-heading"
        >
          <div className="section-heading">
            <h2 id="awards-heading">{copy.awardsHeading}</h2>
          </div>

          <ol className="award-list" aria-label={copy.awardsListLabel}>
            {awards.map((award) => (
              <li className="award-item" key={award.year}>
                <FluidBackdrop />
                <time dateTime={award.year}>{award.year}</time>
                <span className={`award-icon ${award.icon.className}`}>
                  <img
                    src={award.icon.src}
                    alt={award.icon.alt[language]}
                    width={award.icon.width}
                    height={award.icon.height}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <h3
                  lang={language === "zh" && award.year === "2026" ? "en" : undefined}
                >
                  {award.title[language]}
                </h3>
              </li>
            ))}
          </ol>
        </section>
  );
}

export function LifeSection({ language }: { language: Language }) {
  const copy = siteCopy[language];
  return (
        <section className="life-section section-pad" id="life" aria-labelledby="life-heading">
          <div className="section-heading">
            <h2 id="life-heading">{copy.lifeHeading}</h2>
          </div>
          <LifeGallery language={language} />
        </section>
  );
}
