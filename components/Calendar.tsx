import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem } from '../types';
import { getStatusColors } from '../utils';
import TenderDetailsModal from './TenderDetailsModal';

type CalendarProps = {
  store: ReturnType<typeof useTenderStore>;
  onSelectTender: (item: WatchlistItem) => void;
};

const Calendar: React.FC<CalendarProps> = ({ store, onSelectTender }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalTender, setModalTender] = useState<WatchlistItem | null>(null);

  const { watchlist } = store;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleSelectAndCloseModal = (item: WatchlistItem) => {
    setModalTender(null);
    onSelectTender(item);
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

    const grid: any[] = [];
    
    const tendersByDate = watchlist.reduce((acc, tender) => {
        // Normalize date to avoid timezone issues
        const closingDate = new Date(tender.tender.closingDate);
        const utcDate = new Date(Date.UTC(closingDate.getFullYear(), closingDate.getMonth(), closingDate.getDate()));
        const dateKey = utcDate.toISOString().split('T')[0];

        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(tender);
        return acc;
    }, {} as Record<string, WatchlistItem[]>);

    // Days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ key: `prev-${i}`, isCurrentMonth: false });
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const utcDate = new Date(Date.UTC(year, month, day));
      const dateString = utcDate.toISOString().split('T')[0];
      grid.push({
        key: `current-${day}`,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        date: date,
        dayOfMonth: day,
        tenders: tendersByDate[dateString] || []
      });
    }

    // Days from next month
    const remainingCells = 7 - (grid.length % 7);
    if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
            grid.push({ key: `next-${i}`, isCurrentMonth: false });
        }
    }
    
    return grid;
  }, [currentDate, watchlist]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearNum = currentDate.getFullYear();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Calendar</h1>
            <div className="flex items-center gap-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full bg-slate-700/80 hover:bg-slate-700 transition-colors" aria-label="Previous month">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-semibold text-white w-40 text-center">{monthName} {yearNum}</h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full bg-slate-700/80 hover:bg-slate-700 transition-colors" aria-label="Next month">
                     <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-7">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold text-slate-400 py-3 border-b border-r border-slate-700 last:border-r-0">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 min-h-[60vh]">
                {calendarGrid.map((dayInfo, index) => (
                    <div 
                        key={dayInfo.key} 
                        className={`
                            border-b border-r border-slate-700 p-2 
                            ${!dayInfo.isCurrentMonth ? 'bg-slate-800/50' : ''}
                            ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}
                            ${index >= calendarGrid.length - 7 ? 'border-b-0' : ''}
                        `}
                    >
                        {dayInfo.isCurrentMonth && (
                            <>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mb-2 ${dayInfo.isToday ? 'bg-blue-600 text-white' : 'text-slate-200'}`}>
                                    {dayInfo.dayOfMonth}
                                </div>
                                <div className="space-y-1">
                                    {dayInfo.tenders?.map((tender: WatchlistItem) => {
                                        const { bg, text, ring } = getStatusColors(tender.status);
                                        return (
                                            <button 
                                                key={tender.tender.id}
                                                onClick={() => setModalTender(tender)}
                                                className={`w-full text-left p-1.5 rounded-md text-xs ${bg} ${text} hover:ring-2 ${ring} transition-all`}
                                                aria-label={`View details for ${tender.tender.title}`}
                                            >
                                                <p className="font-semibold truncate">{tender.tender.title}</p>
                                                <p className="text-xs opacity-80">{tender.status}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
        
        {modalTender && (
             <TenderDetailsModal
                isOpen={!!modalTender}
                onClose={() => setModalTender(null)}
                onManage={handleSelectAndCloseModal}
                item={modalTender}
             />
        )}
    </div>
  );
};

export default Calendar;
