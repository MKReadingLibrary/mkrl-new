import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type SeatInfo, type ShiftType } from "@shared/schema";

interface SeatGridProps {
  seats: SeatInfo[];
  selectedSeat: SeatInfo | null;
  onSeatClick: (seat: SeatInfo) => void;
}

export default function SeatGrid({ seats, selectedSeat, onSeatClick }: SeatGridProps) {
  const getSeatStyles = (seat: SeatInfo, isSelected: boolean) => {
    const baseClasses = "transition-all cursor-pointer rounded-lg p-3 text-center relative";
    
    let statusClasses = "";
    let textClasses = "";
    
    switch (seat.status) {
      case "vacant":
        statusClasses = "bg-gray-200 hover:bg-gray-300";
        textClasses = "text-gray-700";
        break;
      case "partial":
        // Yellow for partial occupancy (morning OR evening only)
        statusClasses = "bg-yellow-400 hover:bg-yellow-500";
        textClasses = "text-white";
        break;
      case "morning":
        statusClasses = "bg-warning hover:bg-warning/90";
        textClasses = "text-white";
        break;
      case "evening":
        statusClasses = "bg-info hover:bg-info/90";
        textClasses = "text-white";
        break;
      case "fullday":
        statusClasses = "bg-success hover:bg-success/90";
        textClasses = "text-white";
        break;
    }
    
    const selectionClasses = isSelected ? "ring-2 ring-primary ring-offset-2" : "";
    
    return cn(baseClasses, statusClasses, selectionClasses, textClasses);
  };

  const renderStatusIndicator = (status: ShiftType) => {
    let bgColor = "";
    switch (status) {
      case "morning":
        bgColor = "bg-warning";
        break;
      case "evening":
        bgColor = "bg-info";
        break;
      case "fullday":
        bgColor = "bg-success";
        break;
    }
    
    return (
      <div className={cn("absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full", bgColor)} />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Seat Layout</h2>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Vacant</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Partial (M or E)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-success rounded mr-2"></div>
              <span className="text-sm text-gray-600">Full Day / Both</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-10 gap-3">
          {seats.map((seat) => {
            const isSelected = selectedSeat?.seatNumber === seat.seatNumber;
            
            return (
              <div
                key={seat.seatNumber}
                className={getSeatStyles(seat, isSelected)}
                onClick={() => onSeatClick(seat)}
                title={seat.assignments.length > 0 ? `${seat.assignments.map(a => a.studentName).join(', ')} - ${seat.status}` : `Seat ${seat.seatNumber} - ${seat.status}`}
              >
                <div className="text-sm font-medium">{seat.seatNumber}</div>
                {seat.assignments.length > 0 && (
                  <div className="absolute -top-1 -right-1 space-x-0.5">
                    {seat.assignments.map((assignment, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "inline-block w-2 h-2 border border-white rounded-full",
                          assignment.shift === 'morning' ? 'bg-warning' :
                          assignment.shift === 'evening' ? 'bg-info' : 'bg-success'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
