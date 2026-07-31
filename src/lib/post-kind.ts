import type { PostKind } from "../content.config";

export const kindLabels = {
  learning: "학습",
  trend: "트렌드",
  worklog: "업무 기록",
  "deep-dive": "심화",
} satisfies Record<PostKind, string>;
