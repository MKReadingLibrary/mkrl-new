import { users, seatAssignments, type User, type InsertUser, type SeatAssignment, type InsertSeatAssignment } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Seat assignment methods
  getAllSeatAssignments(): Promise<SeatAssignment[]>;
  getSeatAssignmentsByNumber(seatNumber: number): Promise<SeatAssignment[]>;
  createSeatAssignment(assignment: InsertSeatAssignment): Promise<SeatAssignment>;
  updateSeatAssignment(seatNumber: number, shift: string, assignment: Partial<InsertSeatAssignment>): Promise<SeatAssignment | undefined>;
  deleteSeatAssignment(seatNumber: number, shift?: string): Promise<boolean>;
  getExpiringAssignments(days: number): Promise<SeatAssignment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private seatAssignments: Map<number, SeatAssignment>;
  private currentUserId: number;
  private currentAssignmentId: number;

  constructor() {
    this.users = new Map();
    this.seatAssignments = new Map();
    this.currentUserId = 1;
    this.currentAssignmentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllSeatAssignments(): Promise<SeatAssignment[]> {
    return Array.from(this.seatAssignments.values());
  }

  async getSeatAssignmentsByNumber(seatNumber: number): Promise<SeatAssignment[]> {
    return Array.from(this.seatAssignments.values()).filter(
      assignment => assignment.seatNumber === seatNumber
    );
  }

  async createSeatAssignment(assignment: InsertSeatAssignment): Promise<SeatAssignment> {
    // Check if seat + shift combination already exists
    const existing = await this.getSeatAssignmentsByNumber(assignment.seatNumber);
    const conflictingAssignment = existing.find(a => 
      a.shift === assignment.shift || 
      (assignment.shift === 'fullday' && (a.shift === 'morning' || a.shift === 'evening')) ||
      ((assignment.shift === 'morning' || assignment.shift === 'evening') && a.shift === 'fullday')
    );
    
    if (conflictingAssignment) {
      throw new Error(`Seat ${assignment.seatNumber} is already assigned for ${assignment.shift} shift`);
    }

    const id = this.currentAssignmentId++;
    const newAssignment: SeatAssignment = {
      id,
      seatNumber: assignment.seatNumber,
      studentName: assignment.studentName,
      studentId: assignment.studentId || null,
      contact: assignment.contact || null,
      shift: assignment.shift,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      assignedAt: new Date(),
    };
    
    this.seatAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateSeatAssignment(seatNumber: number, shift: string, assignment: Partial<InsertSeatAssignment>): Promise<SeatAssignment | undefined> {
    const existing = Array.from(this.seatAssignments.values()).find(
      a => a.seatNumber === seatNumber && a.shift === shift
    );
    if (!existing) {
      return undefined;
    }

    const updated: SeatAssignment = {
      ...existing,
      ...assignment,
      seatNumber: existing.seatNumber,
      shift: existing.shift,
    };

    this.seatAssignments.set(existing.id, updated);
    return updated;
  }

  async deleteSeatAssignment(seatNumber: number, shift?: string): Promise<boolean> {
    if (shift) {
      // Delete specific shift
      const existing = Array.from(this.seatAssignments.values()).find(
        a => a.seatNumber === seatNumber && a.shift === shift
      );
      if (!existing) {
        return false;
      }
      return this.seatAssignments.delete(existing.id);
    } else {
      // Delete all assignments for the seat
      const assignments = await this.getSeatAssignmentsByNumber(seatNumber);
      let deleted = false;
      for (const assignment of assignments) {
        this.seatAssignments.delete(assignment.id);
        deleted = true;
      }
      return deleted;
    }
  }

  async getExpiringAssignments(days: number): Promise<SeatAssignment[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    return Array.from(this.seatAssignments.values()).filter(assignment => 
      assignment.endDate && assignment.endDate <= targetDateStr
    );
  }
}

export const storage = new MemStorage();
