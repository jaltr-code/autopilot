"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function Home() {

    const [teams, setTeams] = useState([]);

    useEffect(() => {
    async function fetchTeams() {
        const token = localStorage.getItem("accessToken");

        const data = await apiFetch("/teams");
        setTeams(data);
    }

    fetchTeams();
    }, []);

    return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-slate-900 text-white p-6">
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
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Calendar</h2>
            <p className="text-slate-600">
              View shifts, leave, and team availability.
            </p>
          </header>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">
              Frontend foundation ready
            </h3>

            <div className="mt-6">
                <h4 className="font-semibold text-slate-900">Teams</h4>

                <div className="mt-3 space-y-2">
                    {teams.map((team: any) => (
                    <div
                        key={team.id}
                        className="rounded-lg border border-slate-200 px-4 py-3 text-slate-700"
                    >
                        {team.name}
                    </div>
                    ))}
                </div>
            </div>

            <p className="mt-2 text-slate-600">
              Next we’ll connect this to the backend and start rendering real
              calendar data.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}