"use client";

import { useState } from "react";
import { Wand2, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        setErrorMsg("Check your email for the confirmation link!");
        // We artificially keep it in loading state to prevent clicking again
        setLoading(false);
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Successful login
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.logoLink}>
            <Wand2 size={32} className={styles.wandIcon} />
            <span className={styles.logoText}>Pixie</span>
          </Link>
          <h1 className={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className={styles.subtitle}>
            {isSignUp ? "Start your magical file transformation journey." : "Sign in to access your workspace."}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <Mail size={18} className={styles.inputIcon} />
            <input
              type="email"
              placeholder="your@email.com"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={18} className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isSignUp && errorMsg.includes("Check") ? '#16a34a' : '#ef4444', background: isSignUp && errorMsg.includes("Check") ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
             </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <span>{loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <Link href="/dashboard" className={styles.guestBtn}>
          <Sparkles size={18} />
          Continue as Guest
        </Link>

        <p className={styles.toggle}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className={styles.toggleBtn}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
