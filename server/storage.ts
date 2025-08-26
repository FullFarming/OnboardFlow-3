import { employees, contentIcons, admins, type Employee, type InsertEmployee, type ContentIcon, type InsertContentIcon, type Admin, type InsertAdmin } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
