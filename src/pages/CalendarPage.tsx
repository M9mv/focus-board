import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface CalendarPageProps {
  onBack: () => void;
}

const CalendarPage = ({ onBack }: CalendarPageProps) => {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="h-screen flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{monthName}</h1>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-2xl text-sm transition-colors ${
                day === null
                  ? ''
                  : isToday(day)
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-foreground hover:bg-secondary cursor-pointer'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Footer - today info */}
      <div className="border-t border-border px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Today: {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default CalendarPage;
