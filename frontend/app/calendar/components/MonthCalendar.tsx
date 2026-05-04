"use client";

type Shift = {
  id: string;
  startDateTime: string;
  endDateTime: string;
  shiftType: {
    name: string;
  };
};

type CalendarUser = {
  id: string;
  firstName: string;
  lastName: string;
  shifts: Shift[];
  leave: {
    id: string;
    startDate: string;
    endDate: string;
    leaveType: {
      id: string;
      name: string;
    };
  }[];
};

export default function MonthCalendar({ users, calendarDate, onDayClick, }: { users: CalendarUser[]; calendarDate: Date; onDayClick: (date: Date) => void }) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const leadingBlankDays = firstDay.getDay();

  const days: Date[] = [];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  function formatLocalDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

  function getShiftsForDay(date: Date) {
    const dayStr = formatLocalDate(date);

    const allShifts = users.flatMap((user) =>
      user.shifts.map((shift) => ({
        ...shift,
        userName: `${user.firstName} ${user.lastName}`,
      })),
    );

    return allShifts.filter((shift) => {
        const shiftDate = formatLocalDate(new Date(shift.startDateTime));
        return shiftDate === dayStr;
    });
  }

  function getLeaveForDay(date: Date) {
    const dayStr = formatLocalDate(date);

    const allLeave = users.flatMap((user) =>
        user.leave.map((leave) => ({
        ...leave,
        userName: `${user.firstName} ${user.lastName}`,
        })),
    );

    return allLeave.filter((leave) => {
        const start = formatLocalDate(new Date(leave.startDate));
        const end = formatLocalDate(new Date(leave.endDate));

        return dayStr >= start && dayStr <= end;
    });
 }

    return (
    <div>
        {/* Weekday headers */}
        <div className="mb-3 grid grid-cols-7 gap-2">
        {weekdays.map((day) => (
            <div key={day} className="text-sm font-semibold text-slate-500">
            {day}
            </div>
        ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: leadingBlankDays }).map((_, index) => (
            <div
                key={`blank-${index}`}
                className="min-h-[120px] rounded-lg border border-transparent p-2"
            />
        ))}
        {days.map((date) => {
            const shifts = getShiftsForDay(date);
            const leave = getLeaveForDay(date);
            const isToday =
            date.toDateString() === new Date().toDateString();
            return (
            <div
                key={date.toISOString()}
                onClick={() => onDayClick(date)}
                className="min-h-[120px] cursor-pointer rounded-lg border p-2 hover:bg-slate-50"
            >
                <div className="text-sm font-semibold text-slate-700">
                {date.getDate()}
                </div>

                <div className="mt-2 space-y-1">
                {shifts.map((shift) => (
                    <div
                    key={shift.id}
                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-900"
                    >
                    <div className="font-medium">{shift.userName}</div>
                    <div className="flex items-center justify-between gap-2">
                        <span>{shift.shiftType.name}</span>
                        <span>
                        {new Date(shift.startDateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(shift.endDateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        </span>
                    </div>
                    </div>
                ))}
                {leave.map((leaveItem) => (
                    <div
                        key={leaveItem.id}
                        className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900"
                    >
                        <div className="font-medium">{leaveItem.userName}</div>
                        <div>{leaveItem.leaveType.name}</div>
                    </div>
                    ))}
                </div>
            </div>
            );
        })}
        </div>
    </div>
    );
}