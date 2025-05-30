import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Loader2 } from "lucide-react";
import { type SeatInfo, type LibraryStats } from "@shared/schema";

interface SeatManagementProps {
  selectedSeat: SeatInfo | null;
  filterType: string;
  searchTerm: string;
  stats?: LibraryStats;
  onFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onAssignSeat: () => void;
  onReleaseSeat: () => void;
  onExportReport: () => void;
  isAssigning: boolean;
  isReleasing: boolean;
}

export default function SeatManagement({
  selectedSeat,
  filterType,
  searchTerm,
  stats,
  onFilterChange,
  onSearchChange,
  onAssignSeat,
  onReleaseSeat,
  onExportReport,
  isAssigning,
  isReleasing,
}: SeatManagementProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case "vacant":
        return "Vacant";
      case "morning":
        return "Morning Shift";
      case "evening":
        return "Evening Shift";
      case "fullday":
        return "Full Day";
      default:
        return "-";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant":
        return "text-gray-600";
      case "morning":
        return "text-warning";
      case "evening":
        return "text-info";
      case "fullday":
        return "text-success";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onAssignSeat}
            disabled={isAssigning}
            className="w-full"
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Assign New Seat
              </>
            )}
          </Button>
          
          <Button
            variant="secondary"
            onClick={onExportReport}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Filter Seats</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shift-filter" className="text-sm font-medium text-gray-700 mb-2">
              Shift Type
            </Label>
            <Select value={filterType} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="vacant">Vacant Only</SelectItem>
                <SelectItem value="partial">Partial (M or E)</SelectItem>
                <SelectItem value="morning">Morning Shift</SelectItem>
                <SelectItem value="evening">Evening Shift</SelectItem>
                <SelectItem value="fullday">Full Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="seat-search" className="text-sm font-medium text-gray-700 mb-2">
              Seat Number
            </Label>
            <Input
              id="seat-search"
              type="text"
              placeholder="Search seat number..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Selection */}
      {selectedSeat && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Selected Seat</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Seat Number:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedSeat.seatNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor(selectedSeat.status)}`}>
                  {getStatusText(selectedSeat.status)}
                </span>
              </div>
              {selectedSeat.assignments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">Current Assignments:</span>
                  {selectedSeat.assignments.map((assignment, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="font-medium">{assignment.studentName}</div>
                      <div className="text-gray-600">
                        {assignment.shift.charAt(0).toUpperCase() + assignment.shift.slice(1)} Shift
                      </div>
                      <div className="text-gray-500">
                        {assignment.startDate} to {assignment.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-2">
              {selectedSeat.availableShifts.length > 0 && (
                <Button
                  onClick={onAssignSeat}
                  disabled={isAssigning}
                  className="w-full"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    `Assign Available Shift${selectedSeat.availableShifts.length > 1 ? 's' : ''}`
                  )}
                </Button>
              )}
              
              {selectedSeat.assignments.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={onReleaseSeat}
                  disabled={isReleasing}
                  className="w-full"
                >
                  {isReleasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    "Release All Assignments"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Shift Statistics</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded mr-3"></div>
                <span className="text-sm text-gray-600">Morning Shift</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.morningShift}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-info rounded mr-3"></div>
                <span className="text-sm text-gray-600">Evening Shift</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.eveningShift}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded mr-3"></div>
                <span className="text-sm text-gray-600">Full Day</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.fullDayShift}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
