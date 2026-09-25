export type LifePhoto = {
  id: string;
  width: number;
  height: number;
  title: { en: string; zh: string };
  alt: { en: string; zh: string };
};

// Keep the original framing and describe only what is visible in each photograph.
export const lifePhotos = [
  {
    id: "lake-town",
    width: 1440,
    height: 960,
    title: { zh: "山海之间", en: "Between Earth & Sky" },
    alt: {
      en: "A lakeside town with glowing streets beneath a mountain range",
      zh: "群山下的湖畔小镇，街道灯光渐次亮起",
    },
  },
  {
    id: "tower-at-dusk",
    width: 1080,
    height: 1653,
    title: { zh: "一盏灯", en: "A Light in the Blue" },
    alt: {
      en: "An orange-lit tower rising above a city at dusk",
      zh: "暮色中的城市，一座高塔亮起橙色灯光",
    },
  },
  {
    id: "white-blossoms",
    width: 1080,
    height: 1620,
    title: { zh: "自在生长", en: "Quietly Growing" },
    alt: {
      en: "A tall stem of white bell-shaped flowers against a softly blurred garden",
      zh: "柔和虚化的花园前，一簇白色铃状花朵沿花茎垂落",
    },
  },
  {
    id: "willow-pavilion",
    width: 1620,
    height: 1080,
    title: { zh: "春有回响", en: "Echoes of Spring" },
    alt: {
      en: "Willow branches framing a pavilion beside blue water",
      zh: "垂柳枝条掩映着碧水旁的亭阁",
    },
  },
  {
    id: "golden-water",
    width: 1080,
    height: 1623,
    title: { zh: "浮光", en: "Liquid Gold" },
    alt: {
      en: "A boat and its passenger silhouetted against shimmering golden water",
      zh: "金色波光中，一艘小船与乘客的剪影",
    },
  },
  {
    id: "stained-glass",
    width: 1440,
    height: 2160,
    title: { zh: "光的形状", en: "The Shape of Light" },
    alt: {
      en: "Escalators descending beneath an ornate arched stained-glass window",
      zh: "精美的拱形彩色玻璃窗下，自动扶梯向下延伸",
    },
  },
  {
    id: "night-market",
    width: 1080,
    height: 1620,
    title: { zh: "人间烟火", en: "Life, Alight" },
    alt: {
      en: "A busy night market lined with illuminated stalls between tall buildings",
      zh: "高楼之间热闹的夜市，亮灯的摊位沿街铺开",
    },
  },
  {
    id: "city-blue-hour",
    width: 1080,
    height: 1620,
    title: { zh: "蓝调", en: "Blue Hour" },
    alt: {
      en: "A dense cityscape and illuminated streets under a deep blue evening sky",
      zh: "深蓝暮色中的密集城市建筑与灯火通明的街道",
    },
  },
  {
    id: "willow-bridge",
    width: 1620,
    height: 1080,
    title: { zh: "慢下来", en: "Take It Slow" },
    alt: {
      en: "People crossing a stone arch bridge over water beneath willow trees",
      zh: "垂柳下，人们走过水面上的石拱桥",
    },
  },
  {
    id: "fireworks",
    width: 1620,
    height: 1080,
    title: { zh: "尽兴", en: "A Moment of Wonder" },
    alt: {
      en: "Golden and white fireworks spreading across a dark night sky",
      zh: "金色与白色烟花在深色夜空中绽放",
    },
  },
] as const satisfies readonly LifePhoto[];

type LifePhotoId = (typeof lifePhotos)[number]["id"];

export const lifePhotoRows = [
  ["lake-town", "tower-at-dusk"],
  ["white-blossoms", "willow-pavilion"],
  ["golden-water", "stained-glass", "night-market", "city-blue-hour"],
  ["willow-bridge", "fireworks"],
] as const satisfies readonly (readonly LifePhotoId[])[];
