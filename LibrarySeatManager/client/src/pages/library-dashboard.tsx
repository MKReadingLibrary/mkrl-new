import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, User } from "lucide-react";
import { getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { type SeatInfo, type LibraryStats, type InsertSeatAssignment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import StatsDashboard from "@/components/stats-dashboard";
import SeatGrid from "@/components/seat-grid";
import SeatManagement from "@/components/seat-management";
import AssignmentModal from "@/components/assignment-modal";
import ExpiringAssignments from "@/components/expiring-assignments";

export default function LibraryDashboard() {
  const [selectedSeat, setSelectedSeat] = useState<SeatInfo | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seats data
  const { data: seats, isLoading: isLoadingSeats } = useQuery<SeatInfo[]>({
    queryKey: ["/api/seats"],
  });

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<LibraryStats>({
    queryKey: ["/api/stats"],
  });

  // Assign seat mutation
  const assignSeatMutation = useMutation({
    mutationFn: async (assignmentData: InsertSeatAssignment) => {
      const response = await apiRequest("POST", "/api/seats/assign", assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowAssignmentModal(false);
      setSelectedSeat(null);
      toast({
        title: "Success",
        description: "Seat assigned successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign seat",
        variant: "destructive",
      });
    },
  });

  // Release seat mutation
  const releaseSeatMutation = useMutation({
    mutationFn: async (seatNumber: number) => {
      const response = await apiRequest("DELETE", `/api/seats/${seatNumber}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedSeat(null);
      toast({
        title: "Success",
        description: "Seat released successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to release seat",
        variant: "destructive",
      });
    },
  });

  const handleSeatClick = (seat: SeatInfo) => {
    setSelectedSeat(seat);
  };

  const handleAssignSeat = () => {
    if (!selectedSeat || selectedSeat.availableShifts.length === 0) {
      toast({
        title: "Error",
        description: "Please select a seat with available shifts",
        variant: "destructive",
      });
      return;
    }
    setShowAssignmentModal(true);
  };

  const handleReleaseSeat = () => {
    if (!selectedSeat || selectedSeat.assignments.length === 0) {
      toast({
        title: "Error",
        description: "Please select a seat with assignments first",
        variant: "destructive",
      });
      return;
    }
    releaseSeatMutation.mutate(selectedSeat.seatNumber);
  };

  const handleAssignmentSubmit = (assignmentData: InsertSeatAssignment) => {
    if (!selectedSeat) return;
    
    const dataWithSeatNumber = {
      ...assignmentData,
      seatNumber: selectedSeat.seatNumber,
    };
    
    assignSeatMutation.mutate(dataWithSeatNumber);
  };

  const exportReport = () => {
    if (!seats || !stats) return;
    
    const reportData = {
      date: getCurrentDate(),
      ...stats,
      seats: seats.map(seat => ({
        seatNumber: seat.seatNumber,
        status: seat.status,
        assignments: seat.assignments.map(assignment => ({
          studentName: assignment.studentName,
          studentId: assignment.studentId,
          shift: assignment.shift,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        })),
      })),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Report exported successfully!",
    });
  };

  // Filter seats based on type and search term
  const filteredSeats = seats?.filter(seat => {
    const matchesFilter = filterType === "all" || seat.status === filterType;
    const matchesSearch = searchTerm === "" || 
      seat.seatNumber.toString().includes(searchTerm) ||
      seat.assignments.some(assignment => 
        assignment.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesFilter && matchesSearch;
  });

  if (isLoadingSeats || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading library data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Book className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Central Library - Seat Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{getCurrentDate()}</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        <StatsDashboard stats={stats} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Seat Grid */}
          <div className="flex-1">
            <SeatGrid
              seats={filteredSeats || []}
              selectedSeat={selectedSeat}
              onSeatClick={handleSeatClick}
            />
          </div>

          {/* Sidebar Controls */}
          <div className="w-full lg:w-80 space-y-6">
            <SeatManagement
              selectedSeat={selectedSeat}
              filterType={filterType}
              searchTerm={searchTerm}
              stats={stats}
              onFilterChange={setFilterType}
              onSearchChange={setSearchTerm}
              onAssignSeat={handleAssignSeat}
              onReleaseSeat={handleReleaseSeat}
              onExportReport={exportReport}
              isAssigning={assignSeatMutation.isPending}
              isReleasing={releaseSeatMutation.isPending}
            />
            
            {/* Expiring Assignments Section */}
            <ExpiringAssignments />
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        selectedSeat={selectedSeat}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleAssignmentSubmit}
        isSubmitting={assignSeatMutation.isPending}
      />
    </div>
  );
}
