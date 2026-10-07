export type Language = "en" | "zh";
export type LocalizedText = Record<Language, string>;

export type Publication = {
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

export type Award = {
  year: string;
  title: LocalizedText;
  icon: {
    src: string;
    alt: LocalizedText;
    width: number;
    height: number;
    className: string;
  };
};

export const siteCopy = {
  en: {
    documentTitle: "Tiancheng He — AI Scientist",
    skipLink: "Skip to content",
    switchLanguage: "Switch to Chinese",
    navigationLabel: "Page sections",
    navigation: {
      home: "Home",
      research: "Research",
      project: "Project",
      awards: "Awards",
      life: "Life",
    },
    role: "AI Scientist",
    name: "Tiancheng He",
    statement:
      "Research should solve real-world problems and improve people’s lives.",
    focusLabel: "Research focus",
    creativityAgent: "Agent ",
    creativity: "Creativity",
    postTraining: "Post-training",
    interpretability: "Interpretability",
    motion: { pause: "Pause background motion", resume: "Resume background motion" },
    portraitAlt: "Portrait of Tiancheng He",
    affiliationsLabel: "Affiliations",
    bupt: "BUPT",
    undergraduate: "Undergraduate",
    hust: "HUST",
    masters: "Master’s",
    profilesLabel: "Research profiles",
    contactLabel: "Contact",
    wechat: "WeChat",
    researchHeading: "Research",
    projectHeading: "Project",
    projectSummary: "A Python practice workspace with ACM and LeetCode modes, custom test cases, and in-browser judging.",
    projectFeatures: ["100 problems", "17 topics", "Saved progress"],
    projectImageAlt: "Hot 100 Python: problem list, Python editor, and test results",
    projectDemo: "Try it online",
    projectCode: "Source code",
    awardsHeading: "Awards",
    awardsListLabel: "Awards in reverse chronological order",
    lifeHeading: "Life",
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
      project: "项目",
      awards: "奖项",
      life: "生活",
    },
    role: "人工智能科学家",
    name: "何天成",
    statement: "研究应解决现实问题，改善人们的生活。",
    focusLabel: "研究方向",
    creativityAgent: "智能体",
    creativity: "创造力",
    postTraining: "后训练",
    interpretability: "可解释性",
    motion: { pause: "暂停背景动效", resume: "继续背景动效" },
    portraitAlt: "何天成的肖像",
    affiliationsLabel: "教育经历",
    bupt: "北京邮电大学",
    undergraduate: "本科",
    hust: "华中科技大学",
    masters: "硕士",
    profilesLabel: "学术主页",
    contactLabel: "联系方式",
    wechat: "微信",
    researchHeading: "研究",
    projectHeading: "项目",
    projectSummary: "支持 ACM 与 LeetCode 双模式的 Python 在线刷题工具，可编写代码、自定义测试并即时判题。",
    projectFeatures: ["100 道题", "17 类知识点", "进度自动保存"],
    projectImageAlt: "Hot 100 Python 的题目列表、Python 编辑器与判题结果",
    projectDemo: "在线使用",
    projectCode: "项目源码",
    awardsHeading: "奖项",
    awardsListLabel: "按时间倒序排列的奖项",
    lifeHeading: "生活",
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
    venue: "IMWUT 2026",
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
    date: { en: "Aug 2026", zh: "2026年8月" },
    dateTime: "2026-08-21",
    venue: "EMNLP 2026 Main",
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
      { label: { en: "Paper", zh: "论文" }, href: "https://openreview.net/forum?id=cxpvH46GvW" },
      { label: { en: "Code", zh: "代码" }, href: "https://github.com/Ed-Bg/SaFeR-Steer-full" },
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
    date: { en: "Sep 2026", zh: "2026年9月" },
    dateTime: "2026-09-08",
    venue: "AACL-IJCNLP 2026 Main",
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
      { label: { en: "Paper", zh: "论文" }, href: "https://openreview.net/forum?id=UglumGIKbl" },
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
    date: { en: "Aug 2026", zh: "2026年8月" },
    dateTime: "2026-08-21",
    venue: "EMNLP 2026 Findings",
    title: {
      en: "An Automated Pipeline for Provably Retrieval-Dependent Benchmark Construction over Dynamic Knowledge",
      zh: "面向动态知识的可证明检索依赖型基准自动构建流程",
    },
    authors: {
      en: "Heng Zhou, Ao Yu, Yuchen Fan, Li Kang, Jianing Shi, Yongting Zhang, Yutao Fan, Tiancheng He, Yibing Lin, Hejia Geng, Yuhao Wu, Xiufeng Song, Zhemeng Zhang, Songtao Huang, Yiran Qin, Wenlong Zhang, Lei Bai, Zhenfei Yin",
      zh: "Heng Zhou、Ao Yu、Yuchen Fan、Li Kang、Jianing Shi、Yongting Zhang、Yutao Fan、何天成、Yibing Lin、Hejia Geng、Yuhao Wu、Xiufeng Song、Zhemeng Zhang、Songtao Huang、Yiran Qin、Wenlong Zhang、Lei Bai、Zhenfei Yin",
    },
    summary: {
      en: "LiveSearchBench builds retrieval-dependent questions from Wikidata snapshot changes, combining topology-aware synthesis with SPARQL-verified unique answers.",
      zh: "LiveSearchBench 基于 Wikidata 快照差异构建依赖检索的问题，结合拓扑感知生成与 SPARQL 验证，确保答案唯一。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://openreview.net/forum?id=ulUTEPCCNE" },
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
  {
    date: { en: "Aug 2026", zh: "2026年8月" },
    dateTime: "2026-08-21",
    venue: "EMNLP 2026 Main",
    title: {
      en: "LatticeMind: A Conflict-Aware Memory Primitive for Multi-Agent Systems",
      zh: "LatticeMind：面向多智能体系统的冲突感知记忆原语",
    },
    authors: {
      en: "Heng Zhou*, Lian Zhang*, Yutao Fan*, Tiancheng He, Siki Chen, Hejia Geng, Philip Torr, Zhenfei Yin",
      zh: "Heng Zhou*、Lian Zhang*、Yutao Fan*、何天成、Siki Chen、Hejia Geng、Philip Torr、Zhenfei Yin",
    },
    summary: {
      en: "Resolves contradictions when agents write to shared memory, combining explicit claim states, symbolic conflict checks, and selective LLM reconciliation.",
      zh: "在多智能体共享记忆的写入阶段处理矛盾，通过显式状态、符号冲突检查与选择性大模型协调，维护可追溯的当前记忆。",
    },
    links: [
      { label: { en: "Paper", zh: "论文" }, href: "https://openreview.net/forum?id=eZ1kdXXe9x" },
    ],
    image: "/images/paper-latticemind-1000.webp",
    imageAlt: {
      en: "LatticeMind Figure 1: structured writes, conflict resolution, and shared memory",
      zh: "LatticeMind 论文图 1：结构化写入、冲突消解与共享记忆框架",
    },
    imageWidth: 1000,
    imageHeight: 667,
  },
];

export const orderedPublications = [...publications].sort((a, b) =>
  b.dateTime.localeCompare(a.dateTime),
);

export const awards: Award[] = [
  {
    year: "2026",
    title: { en: "Queen Mary Prize", zh: "Queen Mary Prize" },
    icon: {
      src: "/brand/qmul-crown.svg",
      alt: {
        en: "Queen Mary University of London logo",
        zh: "伦敦玛丽女王大学标志",
      },
      width: 56,
      height: 48,
      className: "is-qmul",
    },
  },
  {
    year: "2025",
    title: {
      en: "BUPT First-Class Scholarship",
      zh: "北京邮电大学一等奖学金",
    },
    icon: {
      src: "/brand/bupt-seal.jpg",
      alt: { en: "BUPT emblem", zh: "北京邮电大学校徽" },
      width: 128,
      height: 128,
      className: "is-bupt",
    },
  },
  {
    year: "2024",
    title: { en: "National Scholarship", zh: "国家奖学金" },
    icon: {
      src: "/brand/prc-national-emblem.png",
      alt: {
        en: "National Emblem of the People’s Republic of China",
        zh: "中华人民共和国国徽",
      },
      width: 128,
      height: 128,
      className: "is-national",
    },
  },
];
