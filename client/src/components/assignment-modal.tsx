import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { type SeatInfo, type InsertSeatAssignment } from "@shared/schema";

interface AssignmentModalProps {
  isOpen: boolean;
  selectedSeat: SeatInfo | null;
  onClose: () => void;
  onSubmit: (data: InsertSeatAssignment) => void;
  isSubmitting: boolean;
}

export default function AssignmentModal({
  isOpen,
  selectedSeat,
  onClose,
  onSubmit,
  isSubmitting,
}: AssignmentModalProps) {
  const [formData, setFormData] = useState({
    seatNumber: 0,
    studentName: "",
    studentId: "",
    contact: "",
    shift: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (selectedSeat) {
      setFormData(prev => ({
        ...prev,
        seatNumber: selectedSeat.seatNumber,
      }));
    }
  }, [selectedSeat]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        seatNumber: 0,
        studentName: "",
        studentId: "",
        contact: "",
        shift: "",
        startDate: "",
        endDate: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName.trim() || !formData.shift || !formData.startDate || !formData.endDate) {
      return;
    }

    onSubmit({
      seatNumber: formData.seatNumber,
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim() || undefined,
      contact: formData.contact.trim() || undefined,
      shift: formData.shift,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign Seat {selectedSeat?.seatNumber}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="studentName" className="text-sm font-medium text-gray-700">
              Student Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="studentName"
              type="text"
              placeholder="Enter student name"
              value={formData.studentName}
              onChange={(e) => handleInputChange("studentName", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
              Student ID
            </Label>
            <Input
              id="studentId"
              type="text"
              placeholder="Enter student ID (optional)"
              value={formData.studentId}
              onChange={(e) => handleInputChange("studentId", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-gray-700">
              Contact Number
            </Label>
            <Input
              id="contact"
              type="tel"
              placeholder="Enter contact number"
              value={formData.contact}
              onChange={(e) => handleInputChange("contact", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="shift" className="text-sm font-medium text-gray-700">
              Shift Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.shift} onValueChange={(value) => handleInputChange("shift", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                {selectedSeat?.availableShifts.includes('morning') && (
                  <SelectItem value="morning">Morning Shift (9:00 AM - 1:00 PM)</SelectItem>
                )}
                {selectedSeat?.availableShifts.includes('evening') && (
                  <SelectItem value="evening">Evening Shift (2:00 PM - 6:00 PM)</SelectItem>
                )}
                {selectedSeat?.availableShifts.includes('fullday') && (
                  <SelectItem value="fullday">Full Day (9:00 AM - 6:00 PM)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              min={formData.startDate}
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.studentName.trim() || !formData.shift || !formData.startDate || !formData.endDate}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Seat"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
