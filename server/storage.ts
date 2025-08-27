import { employees, contentIcons, admins, contentImages, userProgress, type Employee, type InsertEmployee, type ContentIcon, type InsertContentIcon, type Admin, type InsertAdmin, type ContentImage, type InsertContentImage, type UserProgress, type InsertUserProgress } from "@shared/schema";
import { db } from "./db";
import { eq, asc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Admin methods (for auth compatibility)
  getUser(id: string): Promise<Admin | undefined>;
  getUserByUsername(username: string): Promise<Admin | undefined>;
  createUser(user: InsertAdmin): Promise<Admin>;
  
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUserName(userName: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Content Icon methods
  getContentIcon(id: string): Promise<ContentIcon | undefined>;
  createContentIcon(contentIcon: InsertContentIcon): Promise<ContentIcon>;
  updateContentIcon(id: string, contentIcon: Partial<InsertContentIcon>): Promise<ContentIcon>;
  deleteContentIcon(id: string): Promise<void>;
  getAllContentIcons(): Promise<ContentIcon[]>;
  
  // Content Images methods
  getContentImages(contentId: string): Promise<ContentImage[]>;
  createContentImage(contentImage: InsertContentImage): Promise<ContentImage>;
  deleteContentImages(contentId: string): Promise<void>;
  
  // User Progress methods
  getUserProgress(employeeId: string): Promise<UserProgress[]>;
  getContentProgress(employeeId: string, contentId: string): Promise<UserProgress | undefined>;
  createOrUpdateProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getProgressSummary(employeeId: string): Promise<{ completed: number; total: number; percentage: number }>;
  toggleContentCompletion(employeeId: string, contentId: string): Promise<{ completed: boolean; progress: UserProgress }>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Admin methods (for auth compatibility)
  async getUser(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getUserByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createUser(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByUserName(userName: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userName, userName));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  // Content Icon methods
  async getContentIcon(id: string): Promise<ContentIcon | undefined> {
    const [contentIcon] = await db.select().from(contentIcons).where(eq(contentIcons.id, id));
    return contentIcon || undefined;
  }

  async createContentIcon(insertContentIcon: InsertContentIcon): Promise<ContentIcon> {
    const [contentIcon] = await db
      .insert(contentIcons)
      .values(insertContentIcon)
      .returning();
    return contentIcon;
  }

  async updateContentIcon(id: string, updateData: Partial<InsertContentIcon>): Promise<ContentIcon> {
    const [contentIcon] = await db
      .update(contentIcons)
      .set(updateData)
      .where(eq(contentIcons.id, id))
      .returning();
    return contentIcon;
  }

  async deleteContentIcon(id: string): Promise<void> {
    await db.delete(contentIcons).where(eq(contentIcons.id, id));
  }

  async getAllContentIcons(): Promise<ContentIcon[]> {
    return await db.select().from(contentIcons).orderBy(asc(contentIcons.displayOrder));
  }

  // Content Images methods
  async getContentImages(contentId: string): Promise<ContentImage[]> {
    return await db.select().from(contentImages)
      .where(eq(contentImages.contentId, contentId))
      .orderBy(asc(contentImages.imageOrder));
  }

  async createContentImage(insertContentImage: InsertContentImage): Promise<ContentImage> {
    const [contentImage] = await db
      .insert(contentImages)
      .values(insertContentImage)
      .returning();
    return contentImage;
  }

  async deleteContentImages(contentId: string): Promise<void> {
    await db.delete(contentImages).where(eq(contentImages.contentId, contentId));
  }

  // User Progress methods
  async getUserProgress(employeeId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress)
      .where(eq(userProgress.employeeId, employeeId));
  }

  async getContentProgress(employeeId: string, contentId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.employeeId, employeeId),
        eq(userProgress.contentId, contentId)
      ));
    return progress || undefined;
  }

  async createOrUpdateProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getContentProgress(progressData.employeeId, progressData.contentId);
    
    if (existing) {
      const [updated] = await db
        .update(userProgress)
        .set({
          completed: progressData.completed,
          completedAt: progressData.completed === 1 ? new Date() : null,
        })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProgress)
        .values({
          ...progressData,
          completedAt: progressData.completed === 1 ? new Date() : null,
        })
        .returning();
      return created;
    }
  }

  async getProgressSummary(employeeId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const allContent = await this.getAllContentIcons();
    const userProgressData = await this.getUserProgress(employeeId);
    
    const total = allContent.length;
    const completed = userProgressData.filter(p => p.completed === 1).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }

  async toggleContentCompletion(employeeId: string, contentId: string): Promise<{ completed: boolean; progress: UserProgress }> {
    const existing = await this.getContentProgress(employeeId, contentId);
    
    let newCompletedValue: number;
    if (existing) {
      // Toggle the existing completion status
      newCompletedValue = existing.completed === 1 ? 0 : 1;
    } else {
      // No existing record, mark as completed
      newCompletedValue = 1;
    }
    
    const progress = await this.createOrUpdateProgress({
      employeeId,
      contentId,
      completed: newCompletedValue,
    });
    
    return {
      completed: newCompletedValue === 1,
      progress,
    };
  }
}

export const storage = new DatabaseStorage();
