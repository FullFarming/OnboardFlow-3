import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userName: text("user_name").notNull().unique(),
  userPassword: text("user_password").notNull(),
  email: text("email").notNull(),
  buddyName: text("buddy_name").notNull(),
  lockerNumber: text("locker_number").notNull(),
  laptopInfo: text("laptop_info").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentIcons = pgTable("content_icons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  iconTitle: text("icon_title").notNull(),
  iconImage: text("icon_image"),
  contentType: text("content_type").notNull(),
  contentSource: text("content_source").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table for supporting multiple images per content item
export const contentImages = pgTable("content_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imageCaption: text("image_caption").default(""), // New field for captions
  guideSentence: text("guide_sentence").default(""), // New field for guide sentences
  imageOrder: integer("image_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table for tracking user progress through onboarding content
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  contentId: varchar("content_id").notNull(),
  completed: integer("completed").default(0), // 0 = not started, 1 = completed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Ensure unique constraint on employee-content combination
  uniqueEmployeeContent: uniqueIndex("unique_employee_content").on(table.employeeId, table.contentId),
}));

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

export const insertUserSchema = insertAdminSchema;

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  userName: true,
  userPassword: true,
  email: true,
  buddyName: true,
  lockerNumber: true,
  laptopInfo: true,
});

export const insertContentIconSchema = createInsertSchema(contentIcons).pick({
  iconTitle: true,
  iconImage: true,
  contentType: true,
  contentSource: true,
  displayOrder: true,
});

export const insertContentImageSchema = createInsertSchema(contentImages).pick({
  contentId: true,
  imageUrl: true,
  imageCaption: true,
  guideSentence: true,
  imageOrder: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  employeeId: true,
  contentId: true,
  completed: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertContentIcon = z.infer<typeof insertContentIconSchema>;
export type ContentIcon = typeof contentIcons.$inferSelect;
export type InsertContentImage = z.infer<typeof insertContentImageSchema>;
export type ContentImage = typeof contentImages.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Legacy user types for auth compatibility
export type InsertUser = InsertAdmin;
export type User = Admin;
