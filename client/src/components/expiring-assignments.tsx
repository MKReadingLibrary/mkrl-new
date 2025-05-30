import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { type SeatAssignment } from "@shared/schema";

export default function ExpiringAssignments() {
  const { data: expiringAssignments, isLoading } = useQuery<SeatAssignment[]>({
    queryKey: ["/api/expiring"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return "destructive"; // Already expired
    if (days <= 3) return "destructive"; // Critical
    if (days <= 7) return "secondary"; // Warning
    return "default";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-warning" />
            <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expiringAssignments || expiringAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-success" />
            <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No assignments expiring in the next 7 days.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
            <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
          </div>
          <Badge variant="secondary">{expiringAssignments.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {expiringAssignments
            .sort((a, b) => a.endDate.localeCompare(b.endDate))
            .map((assignment) => {
              const daysLeft = getDaysUntilExpiry(assignment.endDate);
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">
                        {assignment.studentName}
                      </span>
                      <Badge variant={getUrgencyColor(daysLeft)} className="ml-2">
                        {daysLeft < 0 ? "Expired" : 
                         daysLeft === 0 ? "Today" :
                         daysLeft === 1 ? "Tomorrow" :
                         `${daysLeft} days`}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Seat {assignment.seatNumber} • {assignment.shift.charAt(0).toUpperCase() + assignment.shift.slice(1)} Shift
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Ends: {new Date(assignment.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}