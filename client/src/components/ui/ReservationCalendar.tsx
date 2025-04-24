import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reservation, Vehicle } from "@/lib/storage";

interface CalendarDayProps {
  day: Date;
  currentMonth: Date;
  today: Date;
  bookings: {
    vehicle: Vehicle;
    reservation: Reservation;
  }[];
}

const CalendarDay = ({ day, currentMonth, today, bookings }: CalendarDayProps) => {
  const isToday = isSameDay(day, today);
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const hasBookings = bookings.length > 0;
  
  return (
    <div className={cn(
      "calendar-day p-1",
      !isCurrentMonth && "opacity-50",
      isToday && "active",
      hasBookings && "booked"
    )}>
      <div className={cn(
        "h-full border border-gray-200 rounded-md flex flex-col items-center justify-start p-1",
        isToday && "border-2 border-secondary"
      )}>
        <span className={cn(
          "text-sm",
          isToday && "font-bold"
        )}>
          {format(day, 'd')}
        </span>
        
        {hasBookings && (
          <div className="w-full px-1 mt-1 space-y-1 overflow-hidden">
            {bookings.slice(0, 3).map((booking, index) => (
              <div 
                key={booking.reservation.id}
                className={`text-xs text-white rounded px-1 truncate ${index % 2 === 0 ? 'bg-secondary' : 'bg-accent'}`}
                title={`${booking.vehicle?.make || 'N/A'} ${booking.vehicle?.model || 'N/A'} - ${format(new Date(booking.reservation.startDate), 'dd/MM/yyyy')} au ${format(new Date(booking.reservation.endDate), 'dd/MM/yyyy')}`}
              >
                {booking.vehicle?.make ? booking.vehicle.make.substring(0, 3) : 'N/A'}
              </div>
            ))}
            {bookings.length > 3 && (
              <div className="text-xs text-gray-500 text-center">+{bookings.length - 3}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReservationCalendarProps {
  reservations: Reservation[];
  vehicles: Vehicle[];
  onDayClick?: (day: Date) => void;
}

const ReservationCalendar = ({ reservations, vehicles, onDayClick }: ReservationCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Get days of week for header
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Handle month navigation
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  // Get bookings for each day
  const getBookingsForDay = (day: Date) => {
    const dayBookings = reservations.filter(reservation => {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      return day >= startDate && day <= endDate;
    });
    
    return dayBookings.map(reservation => {
      const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
      return {
        reservation,
        vehicle: vehicle || undefined
      };
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-heading font-semibold">Calendrier des réservations</h2>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm text-gray-600 py-2">{day}</div>
        ))}
        
        {days.map(day => {
          const bookings = getBookingsForDay(day);
          return (
            <CalendarDay 
              key={day.toString()}
              day={day}
              currentMonth={currentMonth}
              today={today}
              bookings={bookings}
            />
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Réservation confirmée</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">En attente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;