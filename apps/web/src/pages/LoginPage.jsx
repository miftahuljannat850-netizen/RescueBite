import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { dashboardForRole, setSession } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (loginEmail, loginPassword) => {
    setLoading(true);
    setError("");

    try {
      const payload = await api.login({ email: loginEmail, password: loginPassword });
      setSession(payload.token, payload.user);

      navigate(dashboardForRole(payload.user.role));
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    login(email.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80" alt="Food rescue background" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-[#0F9F76]/75 dark:bg-black/60 backdrop-blur-sm -z-10" />

      <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-[color:var(--color-rescue-surface)] p-7 md:p-9 shadow-2xl">
        <div className="text-center">
          <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-[#0F9F76]/40 rounded-lg">
            <img src={`${import.meta.env.BASE_URL}rescuebite-icon.svg`} alt="RescueBite" className="mx-auto h-12 w-12" />
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-[#0D4436] dark:text-[color:var(--color-rescue-text)]">Welcome Back</h1>
          <p className="mt-1 text-sm text-stone-400 dark:text-[color:var(--color-rescue-text-muted)]">Sign in to RescueBite</p>
        </div>

        {error ? <div className="mt-5 rounded-xl bg-rose-50 dark:bg-rose-900/25 p-3 text-sm font-medium text-rose-700 dark:text-rose-300">{error}</div> : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-400 dark:text-[color:var(--color-rescue-text-muted)]">Email Address</label>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-[#E6ECE8] dark:border-[color:var(--color-rescue-border)] bg-[#F4F7F5]/80 dark:bg-[color:var(--color-rescue-bg)] p-3 text-stone-800 dark:text-[color:var(--color-rescue-text)] outline-none focus:border-[#0F9F76] dark:focus:border-[#0F9F76]" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-400 dark:text-[color:var(--color-rescue-text-muted)]">Password</label>
            <div className="relative mt-2">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#E6ECE8] dark:border-[color:var(--color-rescue-border)] bg-[#F4F7F5]/80 dark:bg-[color:var(--color-rescue-bg)] p-3 pr-11 text-stone-800 dark:text-[color:var(--color-rescue-text)] outline-none focus:border-[#0F9F76]" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-[color:var(--color-rescue-text-muted)]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F9F76] p-3.5 font-black uppercase tracking-wider text-white hover:bg-[#0C8562] disabled:opacity-60">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500 dark:text-[color:var(--color-rescue-text-muted)]">
          New to RescueBite? <Link to="/register" className="font-bold text-[#0F9F76] hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
