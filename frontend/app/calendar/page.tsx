"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import MonthCalendar from "./components/MonthCalendar";
import { AnimatePresence, motion } from "framer-motion";

type Team = {
  id: string;
  name: string;
};

type CalendarUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  shifts: {
    id: string;
    date: string;
    startDateTime: string;
    endDateTime: string;
    shiftType: {
      id: string;
      name: string;
    };
    team: {
      id: string;
      name: string;
    } | null;
    isGenerated: boolean;
  }[];
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

export default function CalendarPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<CalendarUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("MONTH");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const searchedUserOptions = userOptions.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(userSearch.toLowerCase());
    });

    const today = new Date(); //

    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); //

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

    function goToPreviousMonth() {
    setCalendarDate(new Date(year, month - 1, 1));
    }

    function goToNextMonth() {
    setCalendarDate(new Date(year, month + 1, 1));
    }

    

    const filteredUsers = users.filter((user) =>
    selectedUserIds.includes(user.id),
    );

  useEffect(() => {
    async function loadTeams() {
      const data = await apiFetch("/teams");
      setTeams(data);

      if (data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    }

    loadTeams();
    }, []);

    useEffect(() => {
    async function loadUserOptions() {
        const data = await apiFetch("/users");
        setUserOptions(data);
    }

    loadUserOptions();
    }, []);

    useEffect(() => {
        if (!selectedTeamId) return;

    async function loadCalendar() {
    setLoading(true);

    const teamUsers = await apiFetch(`/teams/${selectedTeamId}/users`);

    const userIds = teamUsers.map((user: any) => user.id);

    if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
    }

    const data = await apiFetch("/calendar/users", {
        method: "POST",
        body: JSON.stringify({
        start,
        end,
        userIds,
        }),
    });

    setUsers(data.users);
    setLoading(false);
    }

    loadCalendar();
  }, [selectedTeamId]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">AutoPilot</h1>

          <nav className="mt-8 space-y-3">
            <div className="rounded-lg bg-slate-800 px-4 py-2">Calendar</div>
            <div className="rounded-lg px-4 py-2 text-slate-300">Teams</div>
            <div className="rounded-lg px-4 py-2 text-slate-300">Users</div>
            <div className="rounded-lg px-4 py-2 text-slate-300">Leave</div>
            <div className="rounded-lg px-4 py-2 text-slate-300">Settings</div>
          </nav>
        </aside>

        <section className="flex-1 p-8">
            <header className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Calendar</h2>
                <p className="text-slate-600">View team shifts and approved leave.</p>
            </div>

            <div className="flex rounded-lg border border-slate-300 bg-white p-1">
                {["MONTH", "WEEK", "DAY"].map((view) => (
                    <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                        calendarView === view
                        ? "bg-slate-900 text-white"
                        : "text-slate-600"
                    }`}
                    >
                    {view[0] + view.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className="flex items-start gap-6">
                <div className="flex items-center gap-2">
                <button
                    onClick={goToPreviousMonth}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                    ←
                </button>

                <div className="min-w-32 text-center font-semibold text-slate-900">
                    {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                    })}
                </div>

                <button
                onClick={() => setCalendarDate(new Date())}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                Today
                </button>

                <button
                    onClick={goToNextMonth}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                    →
                </button>
                </div>

                <div className="w-72 rounded-lg border border-slate-300 bg-white p-3">
                <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />

                <p className="mb-2 text-sm font-medium text-slate-700">
                    Select up to 3 users
                </p>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                    {searchedUserOptions.map((user) => {
                    const checked = selectedUserIds.includes(user.id);
                    const disabled = !checked && selectedUserIds.length >= 3;

                    return (
                        <label
                        key={user.id}
                        className="flex items-center gap-2 text-sm text-slate-700"
                        >
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                                setSelectedUserIds(
                                selectedUserIds.filter((id) => id !== user.id),
                                );
                            }
                            }}
                        />
                        {user.firstName} {user.lastName}
                        </label>
                    );
                    })}
                </div>
                </div>
            </div>
            </header>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
                {calendarView === "MONTH" ? (
                <MonthCalendar
                    users={filteredUsers}
                    calendarDate={calendarDate}
                    onDayClick={(date) => setSelectedDate(date)}
                />
                ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    {calendarView[0] + calendarView.slice(1).toLowerCase()} view coming soon.
                </div>
                )}
            </div>

            <AnimatePresence>
                {selectedDate && (
                    <>
                    <motion.div
                        onClick={() => setSelectedDate(null)}
                        className="fixed inset-0 bg-slate-900/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.aside
                        className="fixed right-0 top-0 h-full w-[420px] border-l border-slate-200 bg-white p-6 shadow-2xl"
                        initial={{ x: 420 }}
                        animate={{ x: 0 }}
                        exit={{ x: 420 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    >
                        {selectedDate && (
                <>
                    <div
                    onClick={() => setSelectedDate(null)}
                    className="fixed inset-0 bg-slate-900/20 transition-opacity duration-200"
                    />

                    <aside className="fixed right-0 top-0 h-full w-[420px] border-l border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 ease-out">
                    <div className="flex items-start justify-between">
                        <div>
                        <p className="text-sm font-medium text-slate-500">Selected day</p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900">
                            {selectedDate.toLocaleDateString("en-GB", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            })}
                        </h3>
                        </div>

                        <button
                        onClick={() => setSelectedDate(null)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        >
                        ✕
                        </button>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Shifts
                        </h4>

                        <div className="space-y-3">
                            {filteredUsers.flatMap((user) =>
                            user.shifts
                                .filter(
                                (shift) =>
                                    new Date(shift.startDateTime).toDateString() ===
                                    selectedDate.toDateString(),
                                )
                                .map((shift) => (
                                <div
                                    key={shift.id}
                                    className="rounded-xl border border-blue-100 bg-blue-50 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-blue-950">
                                        {user.firstName} {user.lastName}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                        {shift.shiftType.name}
                                        </div>
                                    </div>

                                    <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                        {shift.isGenerated ? "Generated" : "Manual"}
                                    </div>
                                    </div>

                                    <div className="mt-3 text-sm text-blue-900">
                                    {new Date(shift.startDateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(shift.endDateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                    </div>
                                </div>
                                )),
                            )}

                            {filteredUsers.every(
                            (user) =>
                                !user.shifts.some(
                                (shift) =>
                                    new Date(shift.startDateTime).toDateString() ===
                                    selectedDate.toDateString(),
                                ),
                            ) && (
                            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                                No shifts scheduled for this day.
                            </div>
                            )}
                        </div>
                        </div>

                        <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Approved Leave
                        </h4>

                        <div className="space-y-3">
                            {filteredUsers.flatMap((user) =>
                            user.leave
                                .filter((leave) => {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                return selectedDate >= start && selectedDate <= end;
                                })
                                .map((leave) => (
                                <div
                                    key={leave.id}
                                    className="rounded-xl border border-amber-100 bg-amber-50 p-4"
                                >
                                    <div className="font-semibold text-amber-950">
                                    {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-sm text-amber-700">
                                    {leave.leaveType.name}
                                    </div>
                                </div>
                                )),
                            )}

                            {filteredUsers.every(
                            (user) =>
                                !user.leave.some((leave) => {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                return selectedDate >= start && selectedDate <= end;
                                }),
                            ) && (
                            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                                No approved leave for this day.
                            </div>
                            )}
                        </div>
                        </div>
                    </div>
                    </aside>
                </>
                )}
                    </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </section>
      </div>
    </main>
  );
}