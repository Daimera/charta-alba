export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ── Database row types ──────────────────────────────────────────────────────

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  published_at: string;
  pdf_url: string;
  arxiv_url: string;
  created_at: string;
}

export interface Card {
  id: string;
  paper_id: string;
  headline: string;
  hook: string;
  body: string;
  tldr: string;
  tags: string[];
  reading_time_seconds: number;
  like_count: number;
  video_url: string | null;
  replication_status: string | null;
  eli5_summary: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  card_id: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  card_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  user_id: string;
  category: string;
  created_at: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string | null;
  authorName: string | null;
  authorImage: string | null;
  replies?: Comment[];
}

export interface CardRating {
  id: string;
  user_id: string;
  card_id: string;
  rating: number;
  created_at: string;
}

export interface Claim {
  id: string;
  paper_id: string;
  user_id: string | null;
  email: string;
  orcid_id: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

// ── Feed types ──────────────────────────────────────────────────────────────

export interface CitationLink {
  cardId: string;
  headline: string;
  tags: string[];
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface FeedCardData {
  id: string;
  paperId: string;
  headline: string;
  hook: string;
  body: string;
  tldr: string;
  tags: string[];
  readingTimeSeconds: number;
  likeCount: number;
  videoUrl: string | null;
  replicationStatus: string | null;
  eli5Summary: string | null;
  createdAt: string | null;
  arxivUrl: string | null;
  paperTitle: string | null;
  abstract: string | null;
  citations?: CitationLink[];
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string | null;
}

// ── Claude pipeline types ───────────────────────────────────────────────────

export interface CardGenerationInput {
  paperId: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
}

export interface CardGenerationOutput {
  headline: string;
  hook: string;
  body: string;
  tldr: string;
  tags: string[];
  reading_time_seconds: number;
}

// ── arXiv API types ─────────────────────────────────────────────────────────

export interface ArxivEntry {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  published: string;
  pdfUrl: string;
  arxivUrl: string;
}
