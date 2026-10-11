"use client";

import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { BrandLogo } from "@/components/risk-badge";
import { saveSession } from "@/lib/session-store";
import { safeJson } from "@/lib/admin-fetch";

export default function AdminAccessPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function seed() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const d = await safeJson<any>(res);
      if (d?.seeded) {
        setCode("ADM-2026");
        setError(null);
      } else {
        setCode("ADM-2026");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSeeding(false);
    }
  }

  async function login() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: trimmed }),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setError(data?.error ?? "Access code not recognised.");
        setBusy(false);
        return;
      }

      if (!data) {
        setError("Invalid server response. Try again.");
        setBusy(false);
        return;
      }

      const s = data.staff;

      // token is returned in both data._token and data.staff.sessionToken
      const token = data._token ?? s.sessionToken ?? "";

      // Save to localStorage — works in ALL browser environments including iframes
      saveSession({
        staffId: s.id,
        token,
        name: s.name,
        role: s.role,
        email: s.email,
        phone: s.phone ?? "",
        title: s.title ?? "",
        accessCode: s.accessCode ?? "",
      });

      setSuccess(true);

      // Use full page navigation so Next.js picks up localStorage on every page
      setTimeout(() => {
        window.location.href = "/admin";
      }, 300);

    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="bcso-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--brand-teal)]" />
          <p className="text-white/70">Opening dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bcso-shell min-h-screen">
      <div className="bcso-grid relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,166,196,0.08),transparent_40%)]" />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <BrandLogo className="h-14 w-auto" />
          </div>

          <div className="mb-5 text-center">
            <span className="bcso-logo-plate mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <ShieldCheck className="h-6 w-6 text-[var(--brand-navy)]" strokeWidth={2.2} />
            </span>
            <h1 className="font-display text-3xl tracking-wide">STAFF SIGN IN</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
              BCSO · Enter your access code
            </p>
          </div>

          <div className="bcso-panel p-6">
            <label className="mono-label !text-[9.5px] mb-2 block">Access Code</label>
            <input
              className="field mono !py-4 text-center !text-2xl uppercase tracking-[0.4em]"
              placeholder="ADM-2026"
              value={code}
              autoFocus
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && !busy && code.trim() && login()}
              maxLength={12}
            />

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2.5 text-xs text-[#ff8a8a]">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={login}
              disabled={busy || !code.trim()}
              className="btn btn-primary mt-4 w-full !py-4 !text-base"
            >
              {busy
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <><span>Sign In</span><ArrowRight className="h-5 w-5" /></>
              }
            </button>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              {[
                ["ADM-2026", "Admin"],
                ["FIN-2026", "Finalizer"],
                ["REV-2026", "Reviewer"],
              ].map(([c, label]) => (
                <button
                  key={c}
                  onClick={() => setCode(c)}
                  className={`rounded-xl border py-2.5 text-center transition-all ${code === c ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}
                >
                  <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/40">{label}</div>
                  <div className="mono mt-0.5 text-[11px] font-bold text-white/80">{c}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-5 text-center">
            <button 
              onClick={async () => {
                if(!window.confirm("Initialize the production database? This will create all tables and issue your Master Admin code.")) return;
                setBusy(true);
                try {
                  const res = await fetch("/api/admin/init-db", { method: "POST" });
                  const d = await res.json();
                  if (res.ok) {
                    alert(`DATABASE INITIALIZED!\n\nYour Master Admin Code is:\n\n${d.accessCode}\n\nSave this code immediately. You will use it to log in.`);
                    setCode(d.accessCode);
                  } else {
                    alert(d.error || d.message);
                  }
                } catch (e) {
                  alert("Failed to initialize database.");
                } finally {
                  setBusy(false);
                }
              }} 
              disabled={busy}
              className="mono text-[9px] uppercase tracking-widest text-[var(--brand-teal-soft)]/50 hover:text-[var(--brand-teal-soft)] transition-colors"
            >
              Initialize Production Database
            </button>
            <br />
            <button
              onClick={seed}
              disabled={seeding || busy}
              className="mono mt-4 text-[9px] uppercase tracking-[0.18em] text-white/20 transition-colors hover:text-[var(--brand-gold)]"
            >
              {seeding ? "Setting up…" : "Reset / Seed Demo Database"}
            </button>
          </div>

          <p className="mono mt-6 text-center text-[8.5px] uppercase tracking-[0.2em] text-white/20">
            Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)
          </p>
        </div>
      </div>
    </div>
  );
}
