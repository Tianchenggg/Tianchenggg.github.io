import type { ReactNode } from "react";
import SectionSwitcher from "./section-switcher";

type Publication = {
  date: string;
  venue: string;
  title: string;
  authors: string;
  summary: string;
  links: { label: string; href: string }[];
  image: string;
  imageAlt: string;
};

const publications: Publication[] = [
  {
    date: "Jul 2026",
    venue: "arXiv · cs.AI",
    title:
      "RareLens: Towards End-to-End Rare Disease Care via Aligning Divergent Large Language Model Reasoning",
    authors:
      "Xi Chen, Hongru Zhou, Shiyu Feng, Hanyu Zhou, Huahui Yi, Rongsheng Wang, Tiancheng He, et al.",
    summary:
      "Aligns complementary reasoning from heterogeneous LLMs across screening, diagnosis, treatment, and prognosis on a 157,525-case rare-disease benchmark.",
    links: [{ label: "Paper", href: "https://arxiv.org/abs/2607.23290" }],
    image: "/figures/rarelens.png",
    imageAlt: "RareLens RareBench and full-cycle simulation from Figure 2",
  },
  {
    date: "Jun 2026",
    venue: "PACM IMWUT · 10(2)",
    title:
      "VCU-LLM: Prompt-efficient On-device Large Language Model for Vague Command Understanding in Smart Homes",
    authors:
      "Zhengyuan Zhang, Dong Zhao, Tiancheng He, Zilong Wang, Xiangyu Li, Huadong Ma",
    summary:
      "Brings vague-command understanding fully on device, improving smart-home control-plan quality by 43.3% while reducing latency by 8.44×.",
    links: [
      { label: "Paper", href: "https://doi.org/10.1145/3810190" },
      {
        label: "Code",
        href: "https://www.kaggle.com/datasets/liema77/on-device-vcu-llm-vague-smart-home-commands",
      },
    ],
    image: "/figures/vcu-llm.png",
    imageAlt: "VCU-LLM edge and cloud system overview from Figure 9",
  },
  {
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
    image: "/figures/safer-steer.png",
    imageAlt: "SaFeR-Steer training framework from the paper",
  },
  {
    date: "Mar 2026",
    venue: "arXiv · cs.LG",
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
    image: "/figures/safer-toolkit.png",
    imageAlt: "SaFeR-ToolKit structured reasoning framework from the paper",
  },
  {
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
    image: "/figures/livesearchbench.png",
    imageAlt: "LiveSearchBench construction pipeline from the paper",
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
      <span className="link-label">{children}</span>
      <span className="link-arrow" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <SectionSwitcher />
        </div>
      </header>

      <main className="portfolio-shell" id="content">
      <section className="hero section-pad" id="home">
        <div className="hero-copy">
          <p className="hero-eyebrow">AI Scientist</p>
          <h1>
            Tiancheng <span>He</span>
          </h1>
          <p className="hero-statement">
            The greatest innovation solves real problems and makes life easier.
          </p>
          <div className="hero-focus-block">
            <span className="hero-focus-label">Research focus</span>
            <p className="hero-focus-values">
              <strong>LLM safety</strong>
              <span aria-hidden="true">/</span>
              <strong>Agent creativity</strong>
            </p>
          </div>
        </div>

        <figure className="hero-portrait">
          <img
            src="/tiancheng-he-cutout-v2.png"
            alt="Portrait of Tiancheng He"
            width="1122"
            height="1402"
          />
        </figure>

        <div className="hero-info-rail">
          <div className="hero-affiliations" aria-label="Affiliations">
            <div className="affiliation-item">
              <img
                src="/brand/hust-seal.jpg"
                alt=""
                width="28"
                height="28"
                aria-hidden="true"
              />
              <span className="affiliation-copy">
                <strong>HUST</strong>
                <small>Current affiliation</small>
              </span>
            </div>
            <div className="affiliation-item">
              <img
                src="/brand/bupt-seal.jpg"
                alt=""
                width="28"
                height="28"
                aria-hidden="true"
              />
              <span className="affiliation-copy">
                <strong>BUPT</strong>
                <small>Previous affiliation</small>
              </span>
            </div>
          </div>

          <nav className="hero-profiles" aria-label="Research profiles">
            <ExternalLink
              className="profile-link profile-huggingface"
              href="https://huggingface.co/htcwang"
            >
              <img
                className="profile-logo profile-huggingface-logo"
                src="/brand/huggingface.svg"
                alt=""
                width="18"
                height="18"
                aria-hidden="true"
              />
              <span>Hugging Face</span>
            </ExternalLink>
            <ExternalLink
              className="profile-link profile-github"
              href="https://github.com/Tianchenggg"
            >
              <img
                className="profile-logo profile-github-logo"
                src="/brand/github-mark.svg"
                alt=""
                width="17"
                height="17"
                aria-hidden="true"
              />
              <span>GitHub</span>
            </ExternalLink>
          </nav>
        </div>
      </section>

      <section className="research section-pad" id="research">
        <div className="section-heading">
          <h2>Research</h2>
        </div>

        <div className="publication-grid">
          {publications.map((publication, index) => (
            <article className="publication-card" key={publication.title}>
              <figure className="publication-visual">
                <img
                  src={publication.image}
                  alt={publication.imageAlt}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </figure>
              <div className="publication-body">
                <div className="publication-meta">
                  <time>{publication.date}</time>
                  <span>{publication.venue}</span>
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
        <div className="section-heading">
          <h2>Project</h2>
        </div>

        <div className="project-panel">
          <div className="project-copy">
            <h3>Activation Revelation</h3>
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

      </main>
    </>
  );
}
