"use client";

import { useState } from "react";
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import styles from "../meta-pages.module.css";

export default function SupportPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}><Mail size={16} /> Help & Support</div>
        <h1 className={styles.title}>How can we <span className={styles.titleHighlight}>help?</span></h1>
        <p className={styles.subtitle}>
          Have a question about the AI prompt engine, need custom API access, or just want to report a bug? We'd love to hear from you.
        </p>
      </div>

      <div className={styles.card}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--mint-green)', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Message Sent!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>We'll get back to you as soon as possible.</p>
            <button 
              onClick={() => setStatus('idle')} 
              className={styles.submitBtn} 
              style={{ margin: '2rem auto 0' }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Your Name</label>
                <div className={styles.inputGroup}>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="Jane Doe" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputGroup}>
                  <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="jane@example.com" />
                </div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subject</label>
              <div className={styles.inputGroup}>
                <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} type="text" placeholder="Issue with magic cut" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Message</label>
              <div className={styles.inputGroup}>
                <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={6} placeholder="Tell us everything..." style={{ resize: 'vertical' }}></textarea>
              </div>
            </div>
            
            {status === 'error' && (
              <div className={`${styles.statusMessage} ${styles.statusError}`}>
                <AlertCircle size={20} />
                <span>Failed to send message. Please try again later.</span>
              </div>
            )}

            <button disabled={status === 'loading'} className={styles.submitBtn} type="submit">
              {status === 'loading' ? 'Sending...' : 'Send Message'} <ArrowRight size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
