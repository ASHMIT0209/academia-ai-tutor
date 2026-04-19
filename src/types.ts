export type RiskCategory = 'danger' | 'avg' | 'good';

export interface StudentProfile {
  prevCgpa: number;
  prevSgpa: number;
  attend: number;
  assign: number;
  backlogs: number;
  sem: number;
  stream: string;
  substream: string;
  internal?: number;
  study: number;
  participation: number;
  procrastination?: number;
  revision?: number;
  screen: number;
  sleep: number;
  stress?: number;
  anxiety?: number;
  confidence?: number;
}

export interface PredictionResult {
  nnP: number[];
  rfP: number[];
  lrP: number[];
  ensP: number[];
  catIdx: number;
  cat: RiskCategory;
  risk: number;
  confidence: string;
}

export interface RoadmapItem {
  week: string;
  color: string;
  title: string;
  desc: string;
  tags: string[];
}

export interface ResourceItem {
  title: string;
  url: string;
  type: 'course' | 'book' | 'tool' | 'video' | 'article';
  desc: string;
}

export interface Factor {
  label: string;
  sub: string;
  val: number;
  weight: string;
  color: string;
  bg: string;
  icon: string;
}
