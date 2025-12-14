import {
  users,
  sharedFiles,
  studentFiles,
  studentNotes,
  screenSharing,
  workstations,
  type User,
  type UpsertUser,
  type SharedFile,
  type InsertSharedFile,
  type StudentFile,
  type InsertStudentFile,
  type StudentNote,
  type InsertStudentNote,
  type ScreenSharing,
  type Workstation,
  TOTAL_STUDENT_POSTES,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<void>;
  updateUserLocked(id: string, isLocked: boolean): Promise<void>;
  
  getStudents(): Promise<User[]>;
  getStudentsByClass(classe: string): Promise<User[]>;
  getOnlineStudents(): Promise<User[]>;
  updateUserStatus(id: string, isOnline: boolean, posteNumber?: number): Promise<void>;
  
  getWorkstations(): Promise<Workstation[]>;
  getWorkstation(id: number): Promise<Workstation | undefined>;
  initializeWorkstations(): Promise<void>;
  claimWorkstation(workstationId: number, studentId: string, studentName: string): Promise<Workstation | undefined>;
  releaseWorkstation(workstationId: number): Promise<void>;
  lockWorkstation(workstationId: number, locked: boolean): Promise<void>;
  lockAllWorkstations(locked: boolean): Promise<void>;
  updateWorkstationActivity(workstationId: number, activity: string | null): Promise<void>;
  
  getSharedFiles(): Promise<SharedFile[]>;
  getSharedFilesByClasses(classes: string[]): Promise<SharedFile[]>;
  createSharedFile(file: InsertSharedFile): Promise<SharedFile>;
  deleteSharedFile(id: string): Promise<void>;
  
  getStudentFiles(ownerId: string): Promise<StudentFile[]>;
  createStudentFile(file: InsertStudentFile): Promise<StudentFile>;
  updateStudentFile(id: string, content: string): Promise<StudentFile | undefined>;
  deleteStudentFile(id: string): Promise<void>;
  
  getStudentNotes(ownerId: string): Promise<StudentNote[]>;
  createStudentNote(note: InsertStudentNote): Promise<StudentNote>;
  updateStudentNote(id: string, data: Partial<InsertStudentNote>): Promise<StudentNote | undefined>;
  deleteStudentNote(id: string): Promise<void>;
  
  getActiveScreenSharing(): Promise<ScreenSharing | null>;
  updateScreenSharing(data: Partial<ScreenSharing>): Promise<ScreenSharing>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: userData.role || "student",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          classe: userData.classe,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserLocked(id: string, isLocked: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isLocked, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getStudents(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "student"));
  }

  async getStudentsByClass(classe: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.classe, classe)));
  }

  async getOnlineStudents(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.isOnline, true)));
  }

  async updateUserStatus(id: string, isOnline: boolean, posteNumber?: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        posteNumber: isOnline ? posteNumber : null,
        lastActivity: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async getWorkstations(): Promise<Workstation[]> {
    return db.select().from(workstations);
  }

  async getWorkstation(id: number): Promise<Workstation | undefined> {
    const [ws] = await db.select().from(workstations).where(eq(workstations.id, id));
    return ws;
  }

  async initializeWorkstations(): Promise<void> {
    const existing = await db.select().from(workstations);
    if (existing.length === 0) {
      const postes = [];
      for (let i = 1; i <= TOTAL_STUDENT_POSTES; i++) {
        postes.push({
          id: i,
          label: `Poste ${i}`,
          isOccupied: false,
          isLocked: false,
        });
      }
      postes.push({
        id: 13,
        label: "Poste Professeur",
        isOccupied: false,
        isLocked: false,
      });
      await db.insert(workstations).values(postes);
    }
  }

  async claimWorkstation(workstationId: number, studentId: string, studentName: string): Promise<Workstation | undefined> {
    const [ws] = await db
      .update(workstations)
      .set({
        isOccupied: true,
        currentStudentId: studentId,
        currentStudentName: studentName,
        lastHeartbeat: new Date(),
      })
      .where(eq(workstations.id, workstationId))
      .returning();
    return ws;
  }

  async releaseWorkstation(workstationId: number): Promise<void> {
    await db
      .update(workstations)
      .set({
        isOccupied: false,
        currentStudentId: null,
        currentStudentName: null,
        lastHeartbeat: null,
      })
      .where(eq(workstations.id, workstationId));
  }

  async lockWorkstation(workstationId: number, locked: boolean): Promise<void> {
    await db
      .update(workstations)
      .set({ isLocked: locked })
      .where(eq(workstations.id, workstationId));
  }

  async lockAllWorkstations(locked: boolean): Promise<void> {
    await db.update(workstations).set({ isLocked: locked });
  }

  async updateWorkstationActivity(workstationId: number, activity: string | null): Promise<void> {
    await db
      .update(workstations)
      .set({ currentActivity: activity, lastHeartbeat: new Date() })
      .where(eq(workstations.id, workstationId));
  }

  async getSharedFiles(): Promise<SharedFile[]> {
    return db.select().from(sharedFiles);
  }

  async getSharedFilesByClasses(classes: string[]): Promise<SharedFile[]> {
    const allFiles = await db.select().from(sharedFiles);
    return allFiles.filter(
      (file) => file.targetClasses?.some((c) => classes.includes(c))
    );
  }

  async createSharedFile(file: InsertSharedFile): Promise<SharedFile> {
    const [newFile] = await db.insert(sharedFiles).values(file).returning();
    return newFile;
  }

  async deleteSharedFile(id: string): Promise<void> {
    await db.delete(sharedFiles).where(eq(sharedFiles.id, id));
  }

  async getStudentFiles(ownerId: string): Promise<StudentFile[]> {
    return db.select().from(studentFiles).where(eq(studentFiles.ownerId, ownerId));
  }

  async createStudentFile(file: InsertStudentFile): Promise<StudentFile> {
    const [newFile] = await db.insert(studentFiles).values(file).returning();
    return newFile;
  }

  async updateStudentFile(id: string, content: string): Promise<StudentFile | undefined> {
    const [updated] = await db
      .update(studentFiles)
      .set({ content, updatedAt: new Date() })
      .where(eq(studentFiles.id, id))
      .returning();
    return updated;
  }

  async deleteStudentFile(id: string): Promise<void> {
    await db.delete(studentFiles).where(eq(studentFiles.id, id));
  }

  async getStudentNotes(ownerId: string): Promise<StudentNote[]> {
    return db.select().from(studentNotes).where(eq(studentNotes.ownerId, ownerId));
  }

  async createStudentNote(note: InsertStudentNote): Promise<StudentNote> {
    const [newNote] = await db.insert(studentNotes).values(note).returning();
    return newNote;
  }

  async updateStudentNote(id: string, data: Partial<InsertStudentNote>): Promise<StudentNote | undefined> {
    const [updated] = await db
      .update(studentNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studentNotes.id, id))
      .returning();
    return updated;
  }

  async deleteStudentNote(id: string): Promise<void> {
    await db.delete(studentNotes).where(eq(studentNotes.id, id));
  }

  async getActiveScreenSharing(): Promise<ScreenSharing | null> {
    const [sharing] = await db
      .select()
      .from(screenSharing)
      .where(eq(screenSharing.isActive, true))
      .limit(1);
    return sharing || null;
  }

  async updateScreenSharing(data: Partial<ScreenSharing>): Promise<ScreenSharing> {
    await db.update(screenSharing).set({ isActive: false, updatedAt: new Date() });
    
    if (data.isActive) {
      const [newSharing] = await db
        .insert(screenSharing)
        .values({
          teacherId: data.teacherId,
          isActive: true,
          targetClasses: data.targetClasses,
          sharedContent: data.sharedContent,
          contentType: data.contentType,
        })
        .returning();
      return newSharing;
    }
    
    return { id: "", isActive: false } as ScreenSharing;
  }
}

export const storage = new DatabaseStorage();
