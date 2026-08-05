"use client";

import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import SectionSwitcher from "./section-switcher";

type Language = "en" | "zh";
type LocalizedText = Record<Language, string>;

type Publication = {
  date: LocalizedText;
  dateTime: string;
  venue: string;
  title: LocalizedText;
  authors: LocalizedText;
  summary: LocalizedText;
  links: { label: LocalizedText; href: string }[];
  image: string;
  imageAlt: LocalizedText;
  imageWidth: number;
  imageHeight: number;
};

type Award = {
  year: string;
  title: LocalizedText;
};

const LANGUAGE_STORAGE_KEY = "tiancheng-portfolio-language";
const languageListeners = new Set<() => void>();
let memoryLanguage: Language = "en";

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en";

  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === "en" || storedLanguage === "zh") {
      memoryLanguage = storedLanguage;
    }
  } catch {
    // The in-memory preference still keeps the control usable in private modes.
  }

  return memoryLanguage;
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LANGUAGE_STORAGE_KEY) return;

    memoryLanguage = event.newValue === "zh" ? "zh" : "en";
    listener();
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function setLanguagePreference(language: Language) {
  memoryLanguage = language;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The current tab still updates when storage is unavailable.
  }

  languageListeners.forEach((listener) => listener());
}

const siteCopy = {
  en: {
    documentTitle: "Tiancheng He — AI Scientist",
    skipLink: "Skip to content",
    switchLanguage: "Switch to Chinese",
    navigationLabel: "Page sections",
    navigation: {
      home: "Home",
      research: "Research",
      awards: "Awards",
      project: "Project",
    },
    role: "AI Scientist",
    name: "Tiancheng He",
    statement:
      "The greatest innovation solves real problems and makes life easier.",
    focusLabel: "Research focus",
    safety: "LLM safety",
    creativity: "Agent creativity",
    portraitAlt: "Portrait of Tiancheng He",
    affiliationsLabel: "Affiliations",
    bupt: "BUPT",
    undergraduate: "Undergraduate",
    hust: "HUST",
    masters: "Master’s",
    profilesLabel: "Research profiles",
    researchHeading: "Research",
    awardsHeading: "Awards",
    awardsListLabel: "Awards in reverse chronological order",
    projectHeading: "Project",
    projectKicker: "Activation-conditioned",
    projectFlowLabel: "Safety-auditing workflow",
    projectModelResponse: "Model response",
    projectUnsafeSegments: "Unsafe segments",
    projectSupportingRegions: "Supporting image regions",
    projectDescription:
      "An activation-conditioned framework for fine-grained multimodal safety auditing: detect unsafe response segments, then ground the image regions that support the risk.",
    projectLink: "Repository",
    projectResultsLabel: "Project results",
    newDataset: "new dataset",
    opensInNewTab: " (opens in a new tab)",
  },
  zh: {
    documentTitle: "何天成 — 人工智能科学家",
    skipLink: "跳至主要内容",
    switchLanguage: "切换为英文",
    navigationLabel: "页面导航",
    navigation: {
      home: "首页",
      research: "研究",
      awards: "奖项",
      project: "项目",
    },
    role: "人工智能科学家",
    name: "何天成",
    statement: "最大的创新，是解决实际问题，让生活更便捷。",
    focusLabel: "研究方向",
    safety: "大语言模型安全",
    creativity: "智能体创造力",
    portraitAlt: "何天成的肖像",
    affiliationsLabel: "教育经历",
    bupt: "北京邮电大学",
    undergraduate: "本科",
    hust: "华中科技大学",
    masters: "硕士",
    profilesLabel: "学术主页",
    researchHeading: "研究",
    awardsHeading: "奖项",
    awardsListLabel: "按时间倒序排列的奖项",
    projectHeading: "项目",
    projectKicker: "激活状态驱动",
    projectFlowLabel: "安全审计流程",
    projectModelResponse: "模型回复",
    projectUnsafeSegments: "不安全片段",
    projectSupportingRegions: "风险支撑区域",
    projectDescription:
      "一个由激活状态驱动的细粒度多模态安全审计框架：先检测回复中的不安全片段，再定位支撑风险判断的图像区域。",
    projectLink: "代码仓库",
    projectResultsLabel: "项目结果",
    newDataset: "新数据集",
    opensInNewTab: "（在新标签页中打开）",
  },
} as const;

const publications: Publication[] = [
  {
    date: { en: "Jul 2026", zh: "2026年7月" },
    dateTime: "2026-07",
    venue: "arXiv · cs.AI",
    title: {
      en: "RareLens: Towards End-to-End Rare Disease Care via Aligning Divergent Large Language Model Reasoning",
      zh: "RareLens：通过对齐差异化大语言模型推理，迈向端到端罕见病诊疗",
    },
    authors: {
      en: "Xi Chen, Hongru Zhou, Shiyu Feng, Hanyu Zhou, Huahui Yi, Rongsheng Wang, Tiancheng He, et al.",
      zh: "Xi Chen、Hongru Zhou、Shiyu Feng、Hanyu Zhou、Huahui Yi、Rongsheng Wang、何天成 等",
    },
    summary: {
      en: "Aligns complementary reasoning from heterogeneous LLMs across screening, diagnosis, treatment, and prognosis on a 157,525-case rare-disease benchmark.",
      zh: "在包含 157,525 个病例的罕见病基准上，对齐异构大语言模型的互补推理，覆盖筛查、诊断、治疗与预后全流程。",
    },
    links: [
      {
        label: { en: "Paper", zh: "论文" },
        href: "https://arxiv.org/abs/2607.23290",
      },
    ],
    image: "/images/paper-rarelens-1000.webp",
    imageAlt: {
      en: "RareLens RareBench and full-cycle simulation from Figure 2",
      zh: "RareLens 论文图 2：RareBench 与罕见病诊疗全流程模拟",
    },
    imageWidth: 1000,
    imageHeight: 1081,
  },
  {
    date: { en: "Jun 2026", zh: "2026年6月" },
    dateTime: "2026-06",
    venue: "PACM IMWUT · 10(2)",
    title: {
      en: "VCU-LLM: Prompt-efficient On-device Large Language Model for Vague Command Understanding in Smart Homes",
      zh: "VCU-LLM：面向智能家居模糊指令理解的提示高效型端侧大语言模型",
    },
    authors: {
      en: "Zhengyuan Zhang, Dong Zhao, Tiancheng He, Zilong Wang, Xiangyu Li, Huadong Ma",
      zh: "Zhengyuan Zhang、Dong Zhao、何天成、Zilong Wang、Xiangyu Li、Huadong Ma",
    },
    summary: {
      en: "Brings vague-command understanding fully on device, improving smart-home control-plan quality by 43.3% while reducing latency by 8.44×.",
      zh: "将模糊指令理解完整部署到端侧，使智能家居控制方案质量提升 43.3%，推理速度提升 8.44 倍。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://doi.org/10.1145/3810190" },
      {
        label: { en: "Code", zh: "代码" },
        href: "https://www.kaggle.com/datasets/liema77/on-device-vcu-llm-vague-smart-home-commands",
      },
    ],
    image: "/images/paper-vcu-llm-1000.webp",
    imageAlt: {
      en: "VCU-LLM edge and cloud system overview from Figure 9",
      zh: "VCU-LLM 论文图 9：端侧与云端系统概览",
    },
    imageWidth: 1000,
    imageHeight: 483,
  },
  {
    date: { en: "May 2026", zh: "2026年5月" },
    dateTime: "2026-05",
    venue: "arXiv · cs.LG / cs.CL",
    title: {
      en: "SaFeR-Steer: Evolving Multi-Turn MLLMs via Synthetic Bootstrapping and Feedback Dynamics",
      zh: "SaFeR-Steer：基于合成自举与反馈动力学演化多轮多模态大语言模型",
    },
    authors: {
      en: "Haolong Hu*, Hanyu Li*, Tiancheng He, Huahui Yi, An Zhang, Qiankun Li, Kun Wang, Yang Liu, Zhigang Zeng",
      zh: "Haolong Hu*、Hanyu Li*、何天成、Huahui Yi、An Zhang、Qiankun Li、Kun Wang、Yang Liu、Zhigang Zeng",
    },
    summary: {
      en: "Combines staged synthetic bootstrapping, tutor-in-the-loop GRPO, and trajectory-aware rewards against escalating multimodal attacks.",
      zh: "结合分阶段合成自举、导师在环 GRPO 与轨迹感知奖励，提升模型对持续升级的多模态攻击的防御能力。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://arxiv.org/abs/2604.16358" },
      { label: { en: "Code", zh: "代码" }, href: "https://github.com/Ed-Bg/SaFeR-Steer" },
    ],
    image: "/images/paper-safer-steer-1000.webp",
    imageAlt: {
      en: "SaFeR-Steer training framework from the paper",
      zh: "SaFeR-Steer 论文中的训练框架",
    },
    imageWidth: 1000,
    imageHeight: 341,
  },
  {
    date: { en: "Mar 2026", zh: "2026年3月" },
    dateTime: "2026-03",
    venue: "arXiv · cs.LG",
    title: {
      en: "SaFeR-ToolKit: Structured Reasoning via Virtual Tool Calling for Multimodal Safety",
      zh: "SaFeR-ToolKit：借助虚拟工具调用实现面向多模态安全的结构化推理",
    },
    authors: {
      en: "Zixuan Xu*, Tiancheng He*, Huahui Yi, Kun Wang, Xi Chen, Gongli Xi, Qiankun Li, Kang Li, Yang Liu, Zhigang Zeng",
      zh: "Zixuan Xu*、何天成*、Huahui Yi、Kun Wang、Xi Chen、Gongli Xi、Qiankun Li、Kang Li、Yang Liu、Zhigang Zeng",
    },
    summary: {
      en: "Turns multimodal safety reasoning into typed, auditable Perception → Reasoning → Decision tool traces trained with SFT, DPO, and GRPO.",
      zh: "将多模态安全推理转化为具有类型约束、可审计的“感知 → 推理 → 决策”工具轨迹，并通过 SFT、DPO 与 GRPO 进行训练。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://arxiv.org/abs/2603.02635" },
      { label: { en: "Code", zh: "代码" }, href: "https://github.com/Duebassx/SaFeR_ToolKit" },
    ],
    image: "/images/paper-safer-toolkit-1000.webp",
    imageAlt: {
      en: "SaFeR-ToolKit structured reasoning framework from the paper",
      zh: "SaFeR-ToolKit 论文中的结构化推理框架",
    },
    imageWidth: 1000,
    imageHeight: 407,
  },
  {
    date: { en: "Nov 2025", zh: "2025年11月" },
    dateTime: "2025-11",
    venue: "arXiv · cs.CL",
    title: {
      en: "LiveSearchBench: An Automatically Constructed Benchmark for Retrieval and Reasoning over Dynamic Knowledge",
      zh: "LiveSearchBench：面向动态知识检索与推理的自动构建基准",
    },
    authors: {
      en: "Heng Zhou*, Ao Yu*, Yuchen Fan*, Jianing Shi, Li Kang, Hejia Geng, Yongting Zhang, Yutao Fan, Yuhao Wu, Tiancheng He, Yiran Qin, Lei Bai, Zhenfei Yin",
      zh: "Heng Zhou*、Ao Yu*、Yuchen Fan*、Jianing Shi、Li Kang、Hejia Geng、Yongting Zhang、Yutao Fan、Yuhao Wu、何天成、Yiran Qin、Lei Bai、Zhenfei Yin",
    },
    summary: {
      en: "Continuously builds temporally grounded, SPARQL-verified questions from Wikidata changes to test retrieval over post-training facts.",
      zh: "基于 Wikidata 的持续变化，自动构建具备时间依据且经 SPARQL 验证的问题，用于评测模型对训练后新事实的检索能力。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://arxiv.org/abs/2511.01409" },
      { label: { en: "Project", zh: "项目主页" }, href: "https://livesearchbench.github.io/" },
      { label: { en: "Code", zh: "代码" }, href: "https://github.com/hengzzzhou/LiveSearchbench" },
    ],
    image: "/images/paper-livesearchbench-1000.webp",
    imageAlt: {
      en: "LiveSearchBench construction pipeline from the paper",
      zh: "LiveSearchBench 论文中的数据构建流程",
    },
    imageWidth: 1000,
    imageHeight: 534,
  },
];

const awards: Award[] = [
  {
    year: "2026",
    title: { en: "Queen Mary Prize", zh: "Queen Mary Prize" },
  },
  {
    year: "2025",
    title: {
      en: "BUPT First-Class Scholarship",
      zh: "北京邮电大学一等奖学金",
    },
  },
  {
    year: "2024",
    title: { en: "National Scholarship", zh: "国家奖学金" },
  },
];

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
}: {
  href: string;
  children: ReactNode;
  language: Language;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <span className="link-label">{children}</span>
      <span className="link-arrow" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only">{siteCopy[language].opensInNewTab}</span>
    </a>
  );
}

export default function Home() {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );
  const copy = siteCopy[language];
  const nextLanguage: Language = language === "en" ? "zh" : "en";

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    document.title = copy.documentTitle;
  }, [copy.documentTitle, language]);

  return (
    <div className="site-language-root" data-language={language} lang={language === "zh" ? "zh-CN" : "en"}>
      <a className="skip-link" href="#content">
        {copy.skipLink}
      </a>

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

          <span className="site-header-balance" aria-hidden="true" />
        </div>
      </header>

      <main className="portfolio-shell" id="content">
        <section className="hero section-pad" id="home">
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
                <strong>{copy.safety}</strong>
                <span aria-hidden="true">/</span>
                <strong>{copy.creativity}</strong>
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
            <div className="hero-affiliations" aria-label={copy.affiliationsLabel}>
              <div className="affiliation-item">
                <img
                  src="/brand/bupt-seal.jpg"
                  alt=""
                  width="28"
                  height="28"
                  aria-hidden="true"
                />
                <span className="affiliation-copy">
                  <strong>{copy.bupt}</strong>
                  <small>{copy.undergraduate}</small>
                </span>
              </div>
              <div className="affiliation-item">
                <img
                  src="/brand/hust-seal.jpg"
                  alt=""
                  width="28"
                  height="28"
                  aria-hidden="true"
                />
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
                language={language}
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
            <h2>{copy.researchHeading}</h2>
          </div>

          <div className="publication-grid">
            {publications.map((publication) => {
              const publicationTitle = publication.title[language];

              return (
                <article className="publication-card" key={publication.title.en}>
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
                <time dateTime={award.year}>{award.year}</time>
                <span className="award-mark" aria-hidden="true">
                  ✦
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

        <section className="project-section section-pad" id="project">
          <div className="section-heading">
            <h2>{copy.projectHeading}</h2>
          </div>

          <div className="project-panel">
            <div className="project-topline">
              <div>
                <span className="project-kicker">{copy.projectKicker}</span>
                <h3>Activation Revelation</h3>
              </div>
              <ExternalLink
                className="project-link project-repository"
                href="https://github.com/Tianchenggg/Activation-Revelation"
                language={language}
              >
                <img
                  src="/brand/github-mark.svg"
                  alt=""
                  width="17"
                  height="17"
                  aria-hidden="true"
                />
                <span>{copy.projectLink}</span>
              </ExternalLink>
            </div>

            <div className="project-main">
              <div className="project-flow">
                <div className="project-flow-heading">
                  <span>{copy.projectFlowLabel}</span>
                  <span aria-hidden="true">01—03</span>
                </div>
                <ol aria-label={copy.projectFlowLabel}>
                  <li>
                    <span aria-hidden="true">01</span>
                    <span
                      className="project-flow-visual is-response"
                      aria-hidden="true"
                    />
                    <strong>{copy.projectModelResponse}</strong>
                  </li>
                  <li>
                    <span aria-hidden="true">02</span>
                    <span
                      className="project-flow-visual is-segments"
                      aria-hidden="true"
                    />
                    <strong>{copy.projectUnsafeSegments}</strong>
                  </li>
                  <li>
                    <span aria-hidden="true">03</span>
                    <span
                      className="project-flow-visual is-regions"
                      aria-hidden="true"
                    />
                    <strong>{copy.projectSupportingRegions}</strong>
                  </li>
                </ol>
              </div>

              <div className="project-copy">
                <p>{copy.projectDescription}</p>
              </div>
            </div>

            <dl className="metric-list" aria-label={copy.projectResultsLabel}>
              <div>
                <dt>Macro-F1</dt>
                <dd>+7.2%</dd>
              </div>
              <div>
                <dt>ACC@0.5</dt>
                <dd>+26.9%</dd>
              </div>
              <div>
                <dt>{copy.newDataset}</dt>
                <dd>ARGUS</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
