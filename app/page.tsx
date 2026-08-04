import type { ReactNode } from "react";

type Publication = {
  index: string;
  date: string;
  venue: string;
  title: string;
  authors: string;
  summary: string;
  links: { label: string; href: string }[];
  image: string;
  imageAlt: string;
  figureLabel: string;
  note?: string;
};

const publications: Publication[] = [
  {
    index: "01",
    date: "Jul 2026",
    venue: "arXiv · cs.AI",
    note: "Latest",
    title:
      "RareLens: Towards End-to-End Rare Disease Care via Aligning Divergent Large Language Model Reasoning",
    authors:
      "Xi Chen, Hongru Zhou, Shiyu Feng, Hanyu Zhou, Huahui Yi, Rongsheng Wang, Tiancheng He, et al.",
    summary:
      "Aligns complementary reasoning from heterogeneous LLMs across screening, diagnosis, treatment, and prognosis on a 157,525-case rare-disease benchmark.",
    links: [{ label: "Paper", href: "https://arxiv.org/abs/2607.23290" }],
    image: "/papers/rarelens.png",
    imageAlt: "RareLens RareBench and full-cycle simulation from Figure 2",
    figureLabel: "Figure 2 · RareBench & full-cycle simulation",
  },
  {
    index: "02",
    date: "Jun 2026",
    venue: "PACM IMWUT · 10(2)",
    note: "Peer-reviewed",
    title:
      "VCU-LLM: Prompt-efficient On-device Large Language Model for Vague Command Understanding in Smart Homes",
    authors:
      "Zhengyuan Zhang, Dong Zhao, Tiancheng He, Zilong Wang, Xiangyu Li, Huadong Ma",
    summary:
      "Brings vague-command understanding fully on device, improving smart-home control-plan quality by 43.3% while reducing latency by 8.44×.",
    links: [{ label: "DOI", href: "https://doi.org/10.1145/3810190" }],
    image: "/papers/vcu-llm.png",
    imageAlt: "VCU-LLM edge and cloud system overview from Figure 9",
    figureLabel: "Figure 9 · VCU-LLM system overview",
  },
  {
    index: "03",
    date: "May 2026",
    venue: "arXiv · cs.LG / cs.CL",
    title:
      "SaFeR-Steer: Evolving Multi-Turn MLLMs via Synthetic Bootstrapping and Feedback Dynamics",
    authors:
      "Haolong Hu*, Hanyu Li*, Tiancheng He, Huahui Yi, An Zhang, Qiankun Li, Kun Wang, Yang Liu, Zhigang Zeng",
    summary:
      "Combines staged synthetic bootstrapping, tutor-in-the-loop GRPO, and trajectory-aware rewards against escalating multimodal attacks.",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2604.16358" },
      { label: "Code", href: "https://github.com/Ed-Bg/SaFeR-Steer" },
    ],
    image: "/papers/safer-steer.png",
    imageAlt: "SaFeR-Steer training framework from the paper",
    figureLabel: "Figure 3 · three-stage training framework",
  },
  {
    index: "04",
    date: "Mar 2026",
    venue: "arXiv · cs.LG",
    note: "Co-first author",
    title:
      "SaFeR-ToolKit: Structured Reasoning via Virtual Tool Calling for Multimodal Safety",
    authors:
      "Zixuan Xu*, Tiancheng He*, Huahui Yi, Kun Wang, Xi Chen, Gongli Xi, Qiankun Li, Kang Li, Yang Liu, Zhigang Zeng",
    summary:
      "Turns multimodal safety reasoning into typed, auditable Perception → Reasoning → Decision tool traces trained with SFT, DPO, and GRPO.",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2603.02635" },
      { label: "Code", href: "https://github.com/Duebassx/SaFeR_ToolKit" },
    ],
    image: "/papers/safer-toolkit.png",
    imageAlt: "SaFeR-ToolKit structured reasoning framework from the paper",
    figureLabel: "Figure 2 · framework & training pipeline",
  },
  {
    index: "05",
    date: "Nov 2025",
    venue: "arXiv · cs.CL",
    title:
      "LiveSearchBench: An Automatically Constructed Benchmark for Retrieval and Reasoning over Dynamic Knowledge",
    authors:
      "Heng Zhou*, Ao Yu*, Yuchen Fan*, Jianing Shi, Li Kang, Hejia Geng, Yongting Zhang, Yutao Fan, Yuhao Wu, Tiancheng He, Yiran Qin, Lei Bai, Zhenfei Yin",
    summary:
      "Continuously builds temporally grounded, SPARQL-verified questions from Wikidata changes to test retrieval over post-training facts.",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2511.01409" },
      { label: "Project", href: "https://livesearchbench.github.io/" },
      { label: "Code", href: "https://github.com/hengzzzhou/LiveSearchbench" },
    ],
    image: "/papers/livesearchbench.png",
    imageAlt: "LiveSearchBench construction pipeline from the paper",
    figureLabel: "Figure 3 · benchmark generation pipeline",
  },
];

function NameHighlighted({ children }: { children: string }) {
  const pieces = children.split("Tiancheng He");

  return (
    <>
      {pieces.map((piece, index) => (
        <span key={`${piece}-${index}`}>
          {piece}
          {index < pieces.length - 1 ? <strong>Tiancheng He</strong> : null}
        </span>
      ))}
    </>
  );
}

function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <span className="link-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <main className="portfolio-shell">
      <a className="skip-link" href="#research">
        Skip to research
      </a>

      <header className="site-header">
        <nav className="glass-nav" aria-label="Primary navigation">
          <a className="brand-mark" href="#top" aria-label="Tiancheng He, home">
            <span className="brand-monogram">TH</span>
            <span>Tiancheng He</span>
          </a>
          <div className="nav-links">
            <a href="#research">Research</a>
            <a href="#project">Project</a>
          </div>
          <ExternalLink className="nav-cta" href="https://github.com/Tianchenggg">
            GitHub
          </ExternalLink>
        </nav>
      </header>

      <section className="hero section-pad" id="top">
        <div className="hero-copy">
          <span className="eyebrow">AI researcher · HUST</span>
          <h1>
            Real innovation
            <span> solves real problems.</span>
          </h1>
          <p className="hero-belief">
            I believe research matters most when it makes people&apos;s lives easier.
          </p>
          <p className="hero-lede">
            I&apos;m <strong>Tiancheng He</strong>. My work focuses on large-model
            safety and agent creativity—turning ambitious AI ideas into useful,
            reliable systems.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#research">
              Selected research <span aria-hidden="true">↓</span>
            </a>
            <ExternalLink className="text-link" href="https://github.com/Tianchenggg">
              GitHub profile
            </ExternalLink>
          </div>
          <p className="research-path">
            <span>Research path</span>
            <strong>BUPT</strong>
            <span aria-hidden="true">→</span>
            <strong>HUST</strong>
          </p>
        </div>

        <figure className="portrait-card">
          <div className="portrait-frame">
            <img
              src="/tiancheng-he.jpg"
              alt="Portrait of Tiancheng He"
              width="960"
              height="1200"
            />
          </div>
          <figcaption>
            <div>
              <strong>Tiancheng He</strong>
              <span>AI Researcher</span>
            </div>
            <span>HUST · Wuhan</span>
          </figcaption>
        </figure>
      </section>

      <section className="research section-pad" id="research">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Selected publications · 2025—2026</span>
            <h2>Selected research</h2>
          </div>
        </div>

        <div className="publication-grid">
          {publications.map((publication, index) => (
            <article
              className={`publication-card ${index === 0 ? "publication-featured" : ""}`}
              key={publication.title}
            >
              <figure className="publication-visual">
                <img
                  src={publication.image}
                  alt={publication.imageAlt}
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <figcaption className="figure-caption">{publication.figureLabel}</figcaption>
              </figure>
              <div className="publication-body">
                <div className="publication-meta">
                  <span className="publication-index">{publication.index}</span>
                  <time>{publication.date}</time>
                  <span>{publication.venue}</span>
                  {publication.note ? <em>{publication.note}</em> : null}
                </div>
                <div className="publication-copy">
                <h3>{publication.title}</h3>
                <p className="publication-authors">
                  <NameHighlighted>{publication.authors}</NameHighlighted>
                </p>
                <p className="publication-summary">{publication.summary}</p>
              </div>
                <div className="publication-links" aria-label={`Links for ${publication.title}`}>
                  {publication.links.map((link) => (
                    <ExternalLink href={link.href} key={link.href}>
                      {link.label}
                    </ExternalLink>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section section-pad" id="project">
        <div className="project-panel">
          <div className="project-copy">
            <span className="eyebrow">Open research project</span>
            <h2>Activation Revelation</h2>
            <p>
              An activation-conditioned framework for fine-grained multimodal
              safety auditing: detect unsafe response segments, then ground the
              image regions that support the risk.
            </p>
            <ExternalLink
              className="project-link"
              href="https://github.com/Tianchenggg/Activation-Revelation"
            >
              Explore the repository
            </ExternalLink>
          </div>
          <div className="metric-list" aria-label="Project results">
            <div>
              <strong>+7.2%</strong>
              <span>Macro-F1</span>
            </div>
            <div>
              <strong>+26.9%</strong>
              <span>ACC@0.5</span>
            </div>
            <div>
              <strong>ARGUS</strong>
              <span>new dataset</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer section-pad">
        <p>
          <strong>Tiancheng He</strong>
          <span>Research for real problems.</span>
        </p>
        <div>
          <span>Wuhan · China</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
