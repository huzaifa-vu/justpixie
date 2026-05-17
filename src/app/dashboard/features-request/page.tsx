"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, ArrowRight, HelpCircle, Flame, Star, Vote } from "lucide-react";
import styles from "../meta-pages.module.css";

interface FeatureSuggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  votes: number;
  userVoted: boolean;
}

export default function FeaturesRequestPage() {
  const [formData, setFormData] = useState({ title: '', category: 'Image', description: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([
    {
      id: "1",
      title: "EPUB to PDF Converter",
      category: "PDF",
      description: "Convert EPUB e-books directly into print-friendly PDF pages locally.",
      votes: 142,
      userVoted: false
    },
    {
      id: "2",
      title: "Audio Noise Reduction",
      category: "Video",
      description: "Strip hums, fan noise, and background static from audio tracks using Web Audio API.",
      votes: 98,
      userVoted: false
    },
    {
      id: "3",
      title: "Smart Image Upscaler",
      category: "Image",
      description: "Upscale lower-res images locally using super-resolution neural nets in WASM.",
      votes: 185,
      userVoted: false
    },
    {
      id: "4",
      title: "SQL to JSON Schema Transpiler",
      category: "Dev",
      description: "Paste SQL table definitions and transpile them into nested JSON Schema schemas.",
      votes: 56,
      userVoted: false
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
      
      // Inject new suggestion locally
      const newSuggestion: FeatureSuggestion = {
        id: Date.now().toString(),
        title: formData.title,
        category: formData.category,
        description: formData.description,
        votes: 1,
        userVoted: true
      };

      setSuggestions(prev => [newSuggestion, ...prev]);
      setFormData({ title: '', category: 'Image', description: '' });
    }, 1000);
  };

  const handleVote = (id: string) => {
    setSuggestions(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          votes: s.userVoted ? s.votes - 1 : s.votes + 1,
          userVoted: !s.userVoted
        };
      }
      return s;
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}><Sparkles size={16} /> Wishlist Core</div>
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
              Your feature request has been recorded successfully. The community can now view, vote, and accelerate its local WASM synthesis.
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
        
        <div className={styles.grid}>
          {suggestions.map((item) => (
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
                    borderColor: item.userVoted ? 'var(--mint-green)' : 'var(--border)',
                    background: item.userVoted ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                    color: item.userVoted ? 'var(--mint-green)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Vote size={14} />
                  <span>{item.userVoted ? 'Wished' : 'Wish'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
