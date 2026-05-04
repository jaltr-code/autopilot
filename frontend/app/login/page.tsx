// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

        console.log("Submitting login...");

        try {
            const res = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
            alert(data.message ?? "Login failed");
            return;
            }

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Check browser console.");
        }
    }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-900">Login</h1>
        <p className="mt-2 text-slate-600">Sign in to AutoPilot.</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          <button className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white">
            Login
          </button>
        </div>
      </form>
    </main>
  );
}