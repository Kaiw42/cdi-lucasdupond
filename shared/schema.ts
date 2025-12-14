import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  classe: varchar("classe", { length: 10 }),
  posteNumber: integer("poste_number"),
  isOnline: boolean("is_online").default(false),
  isLocked: boolean("is_locked").default(false),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workstations table
export const workstations = pgTable("workstations", {
  id: integer("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  isOccupied: boolean("is_occupied").default(false),
  currentStudentId: varchar("current_student_id"),
  currentStudentName: varchar("current_student_name"),
  isLocked: boolean("is_locked").default(false),
  currentActivity: varchar("current_activity", { length: 100 }),
  lastHeartbeat: timestamp("last_heartbeat"),
});

// Files/Documents shared by teachers
export const sharedFiles = pgTable("shared_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content"),
  fileType: varchar("file_type", { length: 50 }).notNull(), // "document" | "folder" | "file"
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  parentId: varchar("parent_id"),
  targetClasses: text("target_classes").array(), // ["6e", "5e", "4e", "3e"]
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student files (personal workspace)
export const studentFiles = pgTable("student_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content"),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  parentId: varchar("parent_id"),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Screen sharing state
export const screenSharing = pgTable("screen_sharing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id),
  isActive: boolean("is_active").default(false),
  targetClasses: text("target_classes").array(),
  sharedContent: text("shared_content"), // Content being shared (document, URL, etc.)
  contentType: varchar("content_type", { length: 50 }), // "document" | "browser" | "presentation"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes for each student
export const studentNotes = pgTable("student_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull().default("Sans titre"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SharedFile = typeof sharedFiles.$inferSelect;
export type InsertSharedFile = typeof sharedFiles.$inferInsert;
export type StudentFile = typeof studentFiles.$inferSelect;
export type InsertStudentFile = typeof studentFiles.$inferInsert;
export type ScreenSharing = typeof screenSharing.$inferSelect;
export type StudentNote = typeof studentNotes.$inferSelect;
export type InsertStudentNote = typeof studentNotes.$inferInsert;
export type Workstation = typeof workstations.$inferSelect;
export type InsertWorkstation = typeof workstations.$inferInsert;

// Schemas for validation
export const insertSharedFileSchema = createInsertSchema(sharedFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFileSchema = createInsertSchema(studentFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentNoteSchema = createInsertSchema(studentNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Class types
export const CLASSES = ["6e", "5e", "4e", "3e"] as const;
export type ClassType = typeof CLASSES[number];

// Poste configuration
export const TOTAL_STUDENT_POSTES = 12;
export const TOTAL_POSTES = 13; // 12 student + 1 teacher
