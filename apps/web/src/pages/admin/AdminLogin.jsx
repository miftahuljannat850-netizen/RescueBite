import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { setSession } from "../../lib/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();

    try {
      const result = await api.login({
        email: trimmedEmail,
        password,
      });

      if (result.user?.role !== "admin") {
        setError("This account does not have administrator access.");
        return;
      }

      setSession(result.token, result.user);
      navigate("/admin/dashboard");
    } catch (error) {
      setError(error.message || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-rescue-bg)] text-[color:var(--color-rescue-text)] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1100px]">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] lg:grid lg:grid-cols-[1.1fr_1fr]">

          <div className="relative hidden bg-[#091f1a] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(16,185,129,0.08),transparent_55%)]" />

            <div className="relative">
              <img
                src={`${import.meta.env.BASE_URL}rescuebite-logo.svg`}
                alt="RescueBite"
                className="h-10 w-auto brightness-0 invert"
              />

              <div className="mt-28 max-w-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300/90">
                  Secure access
                </p>

                <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight">
                  RescueBite Admin Console
                </h1>

                <p className="mt-5 text-sm leading-7 text-white/70">
                  Manage approvals, donations, rescues and platform activity
                  from one place.
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-2.5 text-xs text-white/60">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck size={14} className="text-emerald-400" />
              </span>
              Authorized administrators only
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12 xl:p-14">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-bold text-[#0F9F76] hover:underline underline-offset-4"
            >
              ← Back to RescueBite
            </Link>

            <div className="mt-10">
              <h2 className="text-3xl font-black tracking-tight text-[color:var(--color-rescue-text)]">
                Admin Sign In
              </h2>

              <p className="mt-2.5 text-sm text-[color:var(--color-rescue-text-muted)]">
                Use your admin account to continue.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-500/8 border border-red-500/15 p-4 text-sm font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-8 space-y-6">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-rescue-text-muted)]">
                  Email
                </span>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-2.5 w-full rounded-xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-bg)] p-3.5 text-sm text-[color:var(--color-rescue-text)] outline-none transition-all focus:border-[#0F9F76] focus:ring-4 focus:ring-[#0F9F76]/15"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-rescue-text-muted)]">
                  Password
                </span>

                <div className="relative mt-2.5">
                  <input
                    required
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-bg)] p-3.5 pr-11 text-sm text-[color:var(--color-rescue-text)] outline-none transition-all focus:border-[#0F9F76] focus:ring-4 focus:ring-[#0F9F76]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76] transition-colors"
                  >
                    {show ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F9F76] py-3.5 text-sm font-black text-white hover:bg-[#0C8562] disabled:opacity-60 shadow-lg shadow-[#0F9F76]/25 hover:shadow-xl hover:shadow-[#0F9F76]/30 active:scale-[0.98] transition-all"
              >
                {loading && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[color:var(--color-rescue-text-muted)]">
              Need admin access?{" "}
              <span className="font-semibold text-[color:var(--color-rescue-text)]">
                Contact administrator
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}