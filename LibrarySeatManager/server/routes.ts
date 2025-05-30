import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSeatAssignmentSchema, updateSeatAssignmentSchema, type SeatInfo, type LibraryStats, type ShiftType } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all seats with their assignment status
  app.get("/api/seats", async (req, res) => {
    try {
      const allAssignments = await storage.getAllSeatAssignments();
      const seats: SeatInfo[] = [];
      
      // Generate all 90 seats
      for (let i = 1; i <= 90; i++) {
        const seatAssignments = allAssignments.filter(a => a.seatNumber === i);
        
        let status: 'vacant' | ShiftType | 'partial' = 'vacant';
        let availableShifts: ShiftType[] = ['morning', 'evening', 'fullday'];
        
        if (seatAssignments.length > 0) {
          const shifts = seatAssignments.map(a => a.shift);
          
          if (shifts.includes('fullday')) {
            status = 'fullday';
            availableShifts = [];
          } else if (shifts.includes('morning') && shifts.includes('evening')) {
            status = 'fullday'; // Both shifts occupied = effectively full day
            availableShifts = [];
          } else if (shifts.includes('morning')) {
            status = 'partial';
            availableShifts = ['evening'];
          } else if (shifts.includes('evening')) {
            status = 'partial';
            availableShifts = ['morning'];
          }
        }
        
        seats.push({
          seatNumber: i,
          status,
          assignments: seatAssignments,
          availableShifts,
        });
      }
      
      res.json(seats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seats" });
    }
  });

  // Get library statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const assignments = await storage.getAllSeatAssignments();
      
      const stats: LibraryStats = {
        totalSeats: 90,
        occupiedSeats: assignments.length,
        availableSeats: 90 - assignments.length,
        occupancyRate: Math.round((assignments.length / 90) * 100),
        morningShift: assignments.filter(a => a.shift === 'morning').length,
        eveningShift: assignments.filter(a => a.shift === 'evening').length,
        fullDayShift: assignments.filter(a => a.shift === 'fullday').length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get specific seat assignment
  app.get("/api/seats/:seatNumber", async (req, res) => {
    try {
      const seatNumber = parseInt(req.params.seatNumber);
      
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 90) {
        return res.status(400).json({ message: "Invalid seat number" });
      }
      
      const assignments = await storage.getSeatAssignmentsByNumber(seatNumber);
      
      let status: 'vacant' | ShiftType | 'partial' = 'vacant';
      let availableShifts: ShiftType[] = ['morning', 'evening', 'fullday'];
      
      if (assignments.length > 0) {
        const shifts = assignments.map(a => a.shift);
        
        if (shifts.includes('fullday')) {
          status = 'fullday';
          availableShifts = [];
        } else if (shifts.includes('morning') && shifts.includes('evening')) {
          status = 'fullday';
          availableShifts = [];
        } else if (shifts.includes('morning')) {
          status = 'partial';
          availableShifts = ['evening'];
        } else if (shifts.includes('evening')) {
          status = 'partial';
          availableShifts = ['morning'];
        }
      }
      
      const seatInfo: SeatInfo = {
        seatNumber,
        status,
        assignments,
        availableShifts,
      };
      
      res.json(seatInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seat information" });
    }
  });

  // Assign a seat
  app.post("/api/seats/assign", async (req, res) => {
    try {
      const validationResult = insertSeatAssignmentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid assignment data",
          errors: validationResult.error.errors 
        });
      }
      
      const assignmentData = validationResult.data;
      
      // Validate seat number
      if (assignmentData.seatNumber < 1 || assignmentData.seatNumber > 90) {
        return res.status(400).json({ message: "Invalid seat number" });
      }
      
      // Validate shift type
      if (!['morning', 'evening', 'fullday'].includes(assignmentData.shift)) {
        return res.status(400).json({ message: "Invalid shift type" });
      }
      
      const assignment = await storage.createSeatAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error: any) {
      if (error.message.includes("already assigned")) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to assign seat" });
      }
    }
  });

  // Update seat assignment
  app.put("/api/seats/:seatNumber/:shift", async (req, res) => {
    try {
      const seatNumber = parseInt(req.params.seatNumber);
      const shift = req.params.shift;
      
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 90) {
        return res.status(400).json({ message: "Invalid seat number" });
      }
      
      if (!['morning', 'evening', 'fullday'].includes(shift)) {
        return res.status(400).json({ message: "Invalid shift type" });
      }
      
      const validationResult = updateSeatAssignmentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid assignment data",
          errors: validationResult.error.errors 
        });
      }
      
      const updateData = validationResult.data;
      
      const assignment = await storage.updateSeatAssignment(seatNumber, shift, updateData);
      
      if (!assignment) {
        return res.status(404).json({ message: "Seat assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update seat assignment" });
    }
  });

  // Release (delete) seat assignment - specific shift or all
  app.delete("/api/seats/:seatNumber", async (req, res) => {
    try {
      const seatNumber = parseInt(req.params.seatNumber);
      const shift = req.query.shift as string;
      
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 90) {
        return res.status(400).json({ message: "Invalid seat number" });
      }
      
      const success = await storage.deleteSeatAssignment(seatNumber, shift);
      
      if (!success) {
        return res.status(404).json({ message: "Seat assignment not found" });
      }
      
      res.json({ message: "Seat released successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to release seat" });
    }
  });

  // Get expiring assignments
  app.get("/api/expiring", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const expiringAssignments = await storage.getExpiringAssignments(days);
      res.json(expiringAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expiring assignments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
