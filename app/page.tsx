"use client";

import { useEffect, useRef } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

type Publication = {
  index: string;
  date: string;
  venue: string;
  title: string;
  authors: string;
  summary: string;
  tags: string[];
  links: { label: string; href: string }[];
  featured?: boolean;
  accent: "cyan" | "violet" | "peach" | "blue" | "lime" | "rose";
};

const publications: Publication[] = [
  {
    index: "01",
    date: "Jul 2026",
    venue: "arXiv · cs.AI",
    title:
      "RareLens: Towards End-to-End Rare Disease Care via Aligning Divergent Large Language Model Reasoning",
    authors:
      "Xi Chen, Hongru Zhou, Shiyu Feng, Hanyu Zhou, Huahui Yi, Rongsheng Wang, Tiancheng He, et al.",
    summary:
      "Aligns complementary reasoning from heterogeneous LLMs across screening, diagnosis, treatment, and prognosis on a 157,525-case rare-disease benchmark.",
    tags: ["AI for healthcare", "LLM reasoning", "Decision support"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2607.23290" },
    ],
    featured: true,
    accent: "cyan",
  },
  {
    index: "02",
    date: "Jun 2026",
    venue: "PACM IMWUT · 10(2)",
    title:
      "VCU-LLM: Prompt-efficient On-device Large Language Model for Vague Command Understanding in Smart Homes",
    authors:
      "Zhengyuan Zhang, Dong Zhao, Tiancheng He, Zilong Wang, Xiangyu Li, Huadong Ma",
    summary:
      "Brings vague-command understanding fully on device, improving smart-home control-plan quality by 43.3% while reducing latency by 8.44×.",
    tags: ["On-device LLM", "Ubiquitous computing", "Efficient inference"],
    links: [
      { label: "DOI", href: "https://doi.org/10.1145/3810190" },
    ],
    featured: true,
    accent: "violet",
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
    tags: ["Multimodal safety", "Alignment", "Reinforcement learning"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2604.16358" },
      { label: "Code", href: "https://github.com/Ed-Bg/SaFeR-Steer" },
    ],
    accent: "peach",
  },
  {
    index: "04",
    date: "Mar 2026",
    venue: "arXiv · cs.LG",
    title:
      "SaFeR-ToolKit: Structured Reasoning via Virtual Tool Calling for Multimodal Safety",
    authors:
      "Zixuan Xu*, Tiancheng He*, Huahui Yi, Kun Wang, Xi Chen, Gongli Xi, Qiankun Li, Kang Li, Yang Liu, Zhigang Zeng",
    summary:
      "Turns multimodal safety reasoning into typed, auditable Perception → Reasoning → Decision tool traces trained with SFT, DPO, and GRPO.",
    tags: ["Multimodal safety", "Tool reasoning", "Co-first author"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2603.02635" },
      {
        label: "Code",
        href: "https://github.com/Duebassx/SaFeR_ToolKit",
      },
    ],
    accent: "blue",
  },
  {
    index: "05",
    date: "Jan 2026",
    venue: "arXiv · cs.AI",
    title:
      "RareAlert: Aligning Heterogeneous Large Language Model Reasoning for Early Rare Disease Risk Screening",
    authors:
      "Xi Chen, Hongru Zhou, Huahui Yi, Shiyu Feng, Hanyu Zhou, Tiancheng He, Mingke You, Li Wang, Qiankun Li, Kun Wang, Weili Fu, Kang Li, Jian Li",
    summary:
      "Calibrates reasoning from ten heterogeneous LLMs and distills it into a private, locally deployable model for universal early risk screening.",
    tags: ["Medical AI", "Model ensemble", "Knowledge distillation"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2601.18132" },
    ],
    accent: "rose",
  },
  {
    index: "06",
    date: "Nov 2025",
    venue: "arXiv · cs.CL",
    title:
      "LiveSearchBench: An Automatically Constructed Benchmark for Retrieval and Reasoning over Dynamic Knowledge",
    authors:
      "Heng Zhou*, Ao Yu*, Yuchen Fan*, Jianing Shi, Li Kang, Hejia Geng, Yongting Zhang, Yutao Fan, Yuhao Wu, Tiancheng He, Yiran Qin, Lei Bai, Zhenfei Yin",
    summary:
      "Continuously builds temporally grounded, SPARQL-verified questions from Wikidata changes to test retrieval over post-training facts.",
    tags: ["LLM evaluation", "Retrieval", "Dynamic knowledge"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2511.01409" },
      { label: "Project", href: "https://livesearchbench.github.io/" },
      {
        label: "Code",
        href: "https://github.com/hengzzzhou/LiveSearchbench",
      },
    ],
    accent: "lime",
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
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <span className="link-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    const revealNodes = document.querySelectorAll(".reveal");
    revealNodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pageRef.current || event.pointerType === "touch") return;
    const bounds = pageRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    pageRef.current.style.setProperty("--pointer-x", `${x}%`);
    pageRef.current.style.setProperty("--pointer-y", `${y}%`);
  };

  return (
    <main
      ref={pageRef}
      className="portfolio-shell"
      onPointerMove={handlePointerMove}
    >
      <a className="skip-link" href="#research">
        Skip to research
      </a>

      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />

      <header className="site-header">
        <nav className="glass-nav" aria-label="Primary navigation">
          <a className="brand-mark" href="#top" aria-label="Tiancheng He, home">
            <span className="brand-orb">TH</span>
            <span className="brand-name">Tiancheng He</span>
          </a>
          <div className="nav-links">
            <a href="#research">Research</a>
            <a href="#project">Project</a>
            <a href="#about">About</a>
          </div>
          <ExternalLink
            className="nav-cta"
            href="https://github.com/Tianchenggg"
          >
            GitHub
          </ExternalLink>
        </nav>
      </header>

      <section className="hero section-pad" id="top">
        <div className="hero-copy reveal is-visible">
          <div className="eyebrow status-pill">
            <span className="status-dot" aria-hidden="true" />
            AI researcher · HUST
          </div>
          <h1>
            Building AI that is
            <span className="gradient-line"> safer to trust.</span>
          </h1>
          <p className="hero-lede">
            I&apos;m <strong>Tiancheng He</strong>. My work explores multimodal
            safety, LLM reasoning, efficient intelligence, and AI systems that
            hold up beyond the benchmark.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#research">
              <span>Explore research</span>
              <span aria-hidden="true">↓</span>
            </a>
            <ExternalLink
              className="secondary-button"
              href="https://github.com/Tianchenggg"
            >
              View GitHub
            </ExternalLink>
          </div>
          <div className="hero-footnote">
            <span>Research path</span>
            <span className="path-line" aria-hidden="true" />
            <strong>BUPT</strong>
            <span aria-hidden="true">→</span>
            <strong>HUST</strong>
          </div>
        </div>

        <div className="hero-visual reveal is-visible" aria-label="Research profile summary">
          <div className="orb-stage" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="liquid-orb">
              <div className="orb-core" />
              <div className="orb-glint" />
            </div>
            <div className="floating-chip chip-safety">Multimodal safety</div>
            <div className="floating-chip chip-reasoning">LLM reasoning</div>
            <div className="floating-chip chip-systems">AI systems</div>
          </div>

          <article className="profile-glass">
            <div className="profile-topline">
              <div className="profile-identity">
                <img
                  src="/avatar.png"
                  alt="Tiancheng He's GitHub avatar"
                  width="56"
                  height="56"
                />
                <div>
                  <span className="mini-label">Research profile</span>
                  <strong>@Tianchenggg</strong>
                </div>
              </div>
              <span className="live-badge">Updated</span>
            </div>
            <div className="profile-grid">
              <div>
                <span className="profile-number">06</span>
                <span className="profile-caption">selected works</span>
              </div>
              <div>
                <span className="profile-number">04</span>
                <span className="profile-caption">research themes</span>
              </div>
            </div>
            <div className="profile-latest">
              <span className="mini-label">Latest · July 2026</span>
              <strong>RareLens</strong>
              <p>End-to-end rare disease care through aligned LLM reasoning.</p>
              <ExternalLink href="https://arxiv.org/abs/2607.23290">
                Read the preprint
              </ExternalLink>
            </div>
          </article>
        </div>
      </section>

      <section className="marquee-band" aria-label="Research areas">
        <div className="marquee-track">
          {[0, 1].map((set) => (
            <div className="marquee-set" aria-hidden={set === 1} key={set}>
              <span>Multimodal Safety</span>
              <i>✦</i>
              <span>LLM Reasoning</span>
              <i>✦</i>
              <span>On-device Intelligence</span>
              <i>✦</i>
              <span>AI for Science</span>
              <i>✦</i>
            </div>
          ))}
        </div>
      </section>

      <section className="research section-pad" id="research">
        <div className="section-heading reveal">
          <div>
            <span className="eyebrow">Selected publications · 2025—2026</span>
            <h2>Research, in motion.</h2>
          </div>
          <p>
            From auditable multimodal alignment to dynamic knowledge and
            clinically useful reasoning—systems designed for the conditions
            they will actually face.
          </p>
        </div>

        <div className="publication-grid">
          {publications.map((publication) => (
            <article
              className={`paper-card paper-${publication.accent} reveal ${
                publication.featured ? "paper-featured" : ""
              }`}
              key={publication.title}
            >
              <div className="paper-glow" aria-hidden="true" />
              <div className="paper-topline">
                <span className="paper-index">{publication.index}</span>
                <div className="paper-meta">
                  <span>{publication.date}</span>
                  <span className="meta-divider" aria-hidden="true" />
                  <span>{publication.venue}</span>
                </div>
              </div>
              <div className="paper-content">
                <h3>{publication.title}</h3>
                <p className="paper-authors">
                  <NameHighlighted>{publication.authors}</NameHighlighted>
                </p>
                <p className="paper-summary">{publication.summary}</p>
              </div>
              <div className="tag-row" aria-label="Topics">
                {publication.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="paper-links">
                {publication.links.map((link) => (
                  <ExternalLink href={link.href} key={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section section-pad" id="project">
        <div className="project-card reveal">
          <div className="project-visual" aria-hidden="true">
            <div className="activation-field">
              <span className="activation-node node-one" />
              <span className="activation-node node-two" />
              <span className="activation-node node-three" />
              <span className="activation-node node-four" />
              <span className="activation-line line-one" />
              <span className="activation-line line-two" />
              <span className="activation-line line-three" />
              <span className="scan-plane" />
            </div>
            <span className="visual-label">Internal activation trace · layer 16</span>
          </div>

          <div className="project-copy">
            <span className="eyebrow">Open research project</span>
            <h2>Activation Revelation</h2>
            <p className="project-subtitle">
              Tracing vision-language model vulnerabilities through internal
              activations.
            </p>
            <p>
              An activation-conditioned framework for fine-grained multimodal
              safety auditing: detect unsafe response segments, then ground the
              image regions that support the risk.
            </p>
            <div className="metric-row">
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
            <ExternalLink
              className="project-link"
              href="https://github.com/Tianchenggg/Activation-Revelation"
            >
              Explore the repository
            </ExternalLink>
          </div>
        </div>
      </section>

      <section className="about section-pad" id="about">
        <div className="about-panel reveal">
          <div className="about-portrait">
            <div className="portrait-halo" aria-hidden="true" />
            <img
              src="/avatar.png"
              alt="Tiancheng He"
              width="180"
              height="180"
            />
          </div>
          <div className="about-copy">
            <span className="eyebrow">About</span>
            <h2>Curious about what models know—and how they fail.</h2>
            <p>
              I am an AI researcher affiliated with the School of Artificial
              Intelligence and Automation at HUST, previously at BUPT. I work
              across multimodal safety, language-model reasoning, efficient
              inference, and evaluation under changing real-world knowledge.
            </p>
            <p>
              I care about research that is inspectable, reproducible, and
              useful outside a carefully controlled demo.
            </p>
            <div className="about-links">
              <ExternalLink href="https://github.com/Tianchenggg">
                GitHub profile
              </ExternalLink>
              <ExternalLink href="https://github.com/Tianchenggg?tab=repositories">
                Open-source work
              </ExternalLink>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer section-pad">
        <div className="footer-glass">
          <div>
            <span className="footer-monogram">TH</span>
            <p>Building safer, more capable AI systems.</p>
          </div>
          <div className="footer-meta">
            <span>Wuhan · China</span>
            <span>Research verified August 2026</span>
          </div>
          <a className="back-to-top" href="#top" aria-label="Back to top">
            ↑
          </a>
        </div>
      </footer>
    </main>
  );
}
