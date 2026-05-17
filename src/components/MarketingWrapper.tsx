"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Wand2, User, LogOut, Settings, LayoutDashboard, CreditCard } from "lucide-react";
import styles from "@/app/page.module.css";
import { createClient } from "@/utils/supabase/client";

export default function MarketingWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
  }, []);

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const dropdownItemStyle: React.CSSProperties = {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    color: 'var(--foreground)',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'background 0.15s',
    cursor: 'pointer',
    width: '100%',
  };

  return (
    <div className={styles.container} style={{ overflow: 'visible' }}>
      {/* Universal Navbar */}
      <header className={styles.header} style={{ position: 'relative', zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className={styles.logo}>
            <Image 
              src="/logo-full.png" 
              alt="Pixie Logo" 
              width={120} 
              height={47} 
              priority 
              className={styles.logoImg}
            />
          </div>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/#features">Features</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/pricing" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 600 }}>Pricing</Link>
          
          {!session ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className={styles.loginBtn}>Get Started</button>
            </Link>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className={styles.loginBtn} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)' }}>
                  Dashboard
                </button>
              </Link>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mint-green)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--deep-charcoal)', flexShrink: 0
                }}
              >
                <User size={20} />
              </button>
              
              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: '0', background: 'var(--surface-card)',
                  border: '1px solid var(--border)', borderRadius: '12px', padding: '0.5rem',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12)', width: '240px', zIndex: 9999,
                  display: 'flex', flexDirection: 'column', gap: '0.125rem'
                }}>
                  {/* User Info */}
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {session.user.email}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--mint-green-dark, #059669)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Wand2 size={12} /> <span>100 / 100 Prompts</span>
                    </div>
                  </div>
                  
                  <Link href="/dashboard" style={dropdownItemStyle} 
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'} 
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link href="/pricing" style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'} 
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <CreditCard size={16} /> Manage Subscription
                  </Link>
                  <Link href="/dashboard/settings" style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'} 
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <Settings size={16} /> Preferences
                  </Link>
                  
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button onClick={handleLogout} style={{ ...dropdownItemStyle, border: 'none', color: '#ef4444', background: 'transparent', fontFamily: 'inherit', textAlign: 'left' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'} 
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Main Payload */}
      {children}

      {/* Universal CTA */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.ctaSection}>
          <div className={`${styles.bgBlob} ${styles.blobGold}`} style={{ opacity: 0.6, right: '-10%', left: 'auto', bottom: '-50%' }} />
          <h2>Ready to transform your files?</h2>
          <p className={styles.sectionSubtitle} style={{ color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
            No subscriptions required for basic magic. Join thousands of users optimizing their workflows with AI.
          </p>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button className={styles.ctaBtn}>Get Started Free</button>
          </Link>
        </div>
      </section>

      {/* Universal Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerCol}>
            <div className={styles.logo} style={{ marginBottom: '1rem' }}>
              <Image 
                src="/logo-full.png" 
                alt="Pixie Logo" 
                width={100} 
                height={39} 
                priority 
                className={styles.logoImg}
              />
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Effortless, local, and magical file transformation power inside your browser.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Tools</h4>
            <ul>
              <li><Link href="/dashboard/image">Image Spells</Link></li>
              <li><Link href="/dashboard/pdf">PDF Parsing</Link></li>
              <li><Link href="/dashboard/video">Video Alchemy</Link></li>
              <li><Link href="/dashboard/dev">Dev Tools</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Legal</h4>
            <ul>
              <li><Link href="#">Privacy Policy</Link></li>
              <li><Link href="#">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Pixie Magic Tools. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
