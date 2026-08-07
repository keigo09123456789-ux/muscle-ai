export type Exercise = {
  id: string;
  name: string;
  bodyPart: string;
};

export const exercises: Exercise[] = [
  {
    id: "bench-press",
    name: "ベンチプレス",
    bodyPart: "胸",
  },
  {
    id: "incline-dumbbell-press",
    name: "インクラインダンベルプレス",
    bodyPart: "胸",
  },
  {
    id: "lat-pulldown",
    name: "ラットプルダウン",
    bodyPart: "背中",
  },
  {
    id: "seated-row",
    name: "シーテッドロー",
    bodyPart: "背中",
  },
  {
    id: "squat",
    name: "スクワット",
    bodyPart: "脚",
  },
  {
    id: "leg-press",
    name: "レッグプレス",
    bodyPart: "脚",
  },
  {
    id: "shoulder-press",
    name: "ショルダープレス",
    bodyPart: "肩",
  },
  {
    id: "arm-curl",
    name: "アームカール",
    bodyPart: "腕",
  },
];
