import { pgTable, text, timestamp, integer, jsonb, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  githubToken: text("github_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const githubRepos = pgTable("github_repos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  repoFullName: text("repo_full_name").notNull(),
  websiteUrl: text("website_url"),
  connectedAt: timestamp("connected_at").defaultNow(),
});

export const audits = pgTable("audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  repoId: uuid("repo_id").references(() => githubRepos.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const auditResults = pgTable("audit_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditId: uuid("audit_id").references(() => audits.id),
  seoScore: integer("seo_score"),
  geoScore: integer("geo_score"),
  issues: jsonb("issues"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const optimizations = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditId: uuid("audit_id").references(() => audits.id),
  filePath: text("file_path"),
  originalContent: text("original_content"),
  newContent: text("new_content"),
  status: text("status").default("pending"),
  prUrl: text("pr_url"),
  createdAt: timestamp("created_at").defaultNow(),
});