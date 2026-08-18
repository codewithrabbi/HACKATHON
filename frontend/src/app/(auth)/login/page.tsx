"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle glow inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-brass/5 blur-[80px] pointer-events-none"></div>
        
        <h2 className="font-display text-3xl mb-2 relative z-10 text-paper">Welcome back</h2>
        <p className="text-muted text-sm mb-8 relative z-10">Log in to your OpsPilot account</p>
        
        {error && (
          <div className="bg-alert/10 border border-alert/30 text-alert text-sm px-4 py-3 rounded-xl mb-6 relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10 space-y-5">
          <div>
            <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-line focus:border-brass/50 rounded-xl px-4 py-3 outline-none transition-colors text-paper placeholder-muted/50"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-muted uppercase tracking-wider">Password</label>
              <Link href="#" className="text-xs text-brass hover:text-brasslight transition-colors">Forgot?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface2 border border-line focus:border-brass/50 rounded-xl px-4 py-3 outline-none transition-colors text-paper placeholder-muted/50 pr-12"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-paper transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center bg-brass text-ink font-medium px-4 py-3.5 rounded-xl hover:bg-brasslight transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in to workspace"}
          </button>
        </form>
        
        <p className="text-center text-sm text-muted mt-8 relative z-10">
          Don't have an account? <Link href="/register" className="text-paper hover:text-brass transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
