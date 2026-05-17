"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ArrowRight, HelpCircle, Flame, Star, Vote, Loader2 } from "lucide-react";
import styles from "../meta-pages.module.css";

interface FeatureSuggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  votes: number;
}

export default function FeaturesRequestPage() {
  const [formData, setFormData] = useState({ title: '', category: 'Image', description: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Load voted list from localStorage and fetch all wishes from database
  useEffect(() => {
    // Sync localStorage wishes
    try {
      const saved = localStorage.getItem("pixie_voted_features");
      if (saved) {
        setVotedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Local storage wish parsing failed:", e);
    }

    // Fetch live list
    async function loadWishes() {
      try {
        const res = await fetch("/api/features-request");
        if (!res.ok) throw new Error("Failed to load wishlist");
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err: any) {
        setFetchError("Could not retrieve feature sandbox wishes. Check your connection!");
      } finally {
        setLoadingList(false);
      }
    }

    loadWishes();
  }, []);

  // 2. Submit new feature wish to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch("/api/features-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error("Failed to save feature wish");
      }

      const newWish: FeatureSuggestion = await res.json();

      // Prepend to UI list
      setSuggestions(prev => [newWish, ...prev]);

      // Optimistically self-vote on newly requested feature
      const updatedVoted = [...votedIds, newWish.id];
      setVotedIds(updatedVoted);
      localStorage.setItem("pixie_voted_features", JSON.stringify(updatedVoted));

      setStatus('success');
      setFormData({ title: '', category: 'Image', description: '' });
    } catch (err) {
      alert("Oops! Pixie had trouble casting this feature spell. Please try again.");
      setStatus('idle');
    }
  };

  // 3. Increment/Decrement database count and sync local state & localStorage
  const handleVote = async (id: string) => {
    const hasVoted = votedIds.includes(id);
    const increment = hasVoted ? -1 : 1;

    // Optimistic UI state updates
    setSuggestions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, votes: Math.max(0, s.votes + increment) };
      }
      return s;
    }));

    const nextVotedIds = hasVoted 
      ? votedIds.filter(vId => vId !== id) 
      : [...votedIds, id];

    setVotedIds(nextVotedIds);
    localStorage.setItem("pixie_voted_features", JSON.stringify(nextVotedIds));

    // Async DB update
    try {
      const res = await fetch("/api/features-request/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, increment })
      });

      if (!res.ok) {
        throw new Error("Vote update failed");
      }
      
      const updatedWish = await res.json();
      
      // Update UI state with correct DB value
      setSuggestions(prev => prev.map(s => (s.id === id ? updatedWish : s)));
    } catch (err) {
      console.error("Voting integration error:", err);
      // Revert optimistic state upon failure
      setSuggestions(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, votes: Math.max(0, s.votes - increment) };
        }
        return s;
      }));
      setVotedIds(votedIds);
      localStorage.setItem("pixie_voted_features", JSON.stringify(votedIds));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}><Sparkles size={16} /> Wishlist Sandbox</div>
        <h1 className={styles.title}>Request a <span className={styles.titleHighlight}>Feature</span></h1>
        <p className={styles.subtitle}>
          Pixie runs 100% locally in your browser. Want a specific file action, dev utility, or file compiler added? Suggest it below and help guide our workspace spellbooks!
        </p>
      </div>

      <div className={styles.card}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--mint-green)', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Spell Added to Sandbox!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '480px', margin: '0.75rem auto 0' }}>
              Your feature request has been recorded successfully in our database. The community can now view, vote, and accelerate its local WASM synthesis.
            </p>
            <button 
              onClick={() => setStatus('idle')} 
              className={styles.submitBtn} 
              style={{ margin: '2rem auto 0' }}
            >
              Suggest Another Feature
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Feature Spell Name</label>
                <div className={styles.inputGroup}>
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    type="text" 
                    placeholder="e.g. SVG Optimizer" 
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <div className={styles.inputGroup}>
                  <select 
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--foreground)',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Image" style={{ background: 'var(--surface-card)' }}>Image Magic</option>
                    <option value="PDF" style={{ background: 'var(--surface-card)' }}>PDF Spells</option>
                    <option value="Video" style={{ background: 'var(--surface-card)' }}>Video Alchemy</option>
                    <option value="Dev" style={{ background: 'var(--surface-card)' }}>Dev Utilities</option>
                    <option value="Text" style={{ background: 'var(--surface-card)' }}>Text & Data</option>
                    <option value="Other" style={{ background: 'var(--surface-card)' }}>Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Detailed Spell Description</label>
              <div className={styles.inputGroup}>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  rows={4} 
                  placeholder="Explain exactly what this feature does, how it runs locally, and why it is useful..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <button disabled={status === 'loading'} className={styles.submitBtn} type="submit">
              {status === 'loading' ? 'Casting...' : 'Submit Request'} <ArrowRight size={20} />
            </button>
          </form>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Flame size={20} style={{ color: '#f97316' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Popular Sandbox Wishes</h2>
        </div>
        
        {loadingList ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 0' }}>
            <Loader2 size={36} className={styles.spinIcon} style={{ color: 'var(--mint-green)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Summoning wishes from Database...</span>
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <HelpCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>{fetchError}</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <Sparkles size={40} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--mint-green)' }} />
            <p>No feature wishes requested yet. Be the first to add a spell!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {suggestions.map((item) => {
              const userVoted = votedIds.includes(item.id);
              return (
                <div key={item.id} className={styles.featureCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--border)', color: 'var(--text-muted)' }}>
                        {item.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308' }}>
                        <Star size={12} fill="#eab308" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
                      </div>
                    </div>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureDesc}>{item.description}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <strong>{item.votes}</strong> support wishes
                    </span>
                    
                    <button
                      onClick={() => handleVote(item.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: userVoted ? 'var(--mint-green)' : 'var(--border)',
                        background: userVoted ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                        color: userVoted ? 'var(--mint-green)' : 'var(--foreground)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Vote size={14} />
                      <span>{userVoted ? 'Wished' : 'Wish'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
