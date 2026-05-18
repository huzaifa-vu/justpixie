"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wand2, LayoutDashboard, Image as ImageIcon, FileText, Video, Code, Settings, UserCircle, LogOut, Type, Menu, X, Info, HelpCircle, Sparkles, Download, Sun, Moon, Lightbulb, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useQuota } from "@/hooks/useQuota";
import { useTheme } from "next-themes";
import styles from "./layout.module.css";
import Image from "next/image";
import { FileDropProvider } from "@/contexts/FileDropContext";
import { GlobalDropOverlay } from "@/components/GlobalDropOverlay";
import CommandPalette from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <FileDropProvider>
      <DashboardInnerLayout>{children}</DashboardInnerLayout>
      <GlobalDropOverlay />
    </FileDropProvider>
  );
}

function DashboardInnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { guestUsed, guestLimit, guestRemaining, authPromptsUsed, isUnlimited, authLimit, loading } = useQuota(user);

  // Keyboard listener for Cmd/Ctrl+K command palette
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  // Pre-calculate quota numbers for clean rendering & collapsed SVG progress
  const limit = user ? authLimit : guestLimit;
  const remaining = user ? Math.max(0, authLimit - authPromptsUsed) : guestRemaining;
  const percentage = isUnlimited ? 100 : Math.max(0, Math.min(100, limit > 0 ? (remaining / limit) * 100 : 0));

  const logoIconPath = mounted && theme === 'dark' ? '/logo-icon-dark.png' : '/logo-icon.png';
  const logoFullPath = mounted && theme === 'dark' ? '/logo-full-dark.png' : '/logo-full.png';

  useEffect(() => {
    setMounted(true);
    // Get initial session (wrapped in try/catch for guest mode)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    }).catch(() => {
      setUser(null);
    });

    // If returning from checkout, force-refresh token so user_metadata.tier updates instantly
    if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
      supabase.auth.refreshSession().then(({ data }) => {
        setUser(data.user ?? null);
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    // Listen for auth changes (handles login/logout + token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Listen for quota changes (both guest and auth)
    const handleQuotaChange = () => {
      supabase.auth.getUser().then(({ data: { user: freshUser } }) => {
        if (freshUser) setUser(freshUser);
      });
    };
    window.addEventListener("pixie_quota_changed", handleQuotaChange);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener("pixie_quota_changed", handleQuotaChange);
    };
  }, []);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMoreOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Image Magic", href: "/dashboard/image", icon: ImageIcon },
    { name: "PDF Spells", href: "/dashboard/pdf", icon: FileText },
    { name: "Video Alchemy", href: "/dashboard/video", icon: Video },
    { name: "Dev Utilities", href: "/dashboard/dev", icon: Code },
    { name: "Text & Data", href: "/dashboard/text", icon: Type },
    { name: "Wishlist", href: "/dashboard/features-request", icon: Lightbulb },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer' }}>
            {collapsed ? (
              <Image 
                src={logoIconPath} 
                alt="Pixie Logo" 
                width={42} 
                height={42} 
                priority 
                className={styles.logoImg}
                style={{ height: 'auto' }}
              />
            ) : (
              <Image 
                src={logoFullPath} 
                alt="Pixie Logo" 
                width={170} 
                height={67} 
                priority 
                className={styles.logoImg}
                style={{ height: 'auto' }}
              />
            )}
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            <span className={`${styles.groupLabel} ${collapsed ? styles.groupLabelHidden : ""}`}>Tools</span>
            {navItems.map((item) => {
              // For the root dashboard item, only match the exact path
              // For all others, match the exact path OR any sub-route
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                >
                  <item.icon size={20} />
                  <span className={`${styles.navItemText} ${collapsed ? styles.navItemTextHidden : ""}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className={styles.navGroup} style={{ marginTop: '1.5rem' }}>
            <span className={`${styles.groupLabel} ${collapsed ? styles.groupLabelHidden : ""}`}>Account & Help</span>
            <Link
              href="/dashboard/upgrade"
              className={`${styles.navItem} ${pathname === '/dashboard/upgrade' ? styles.active : ""}`}
            >
              <Sparkles size={20} />
              <span className={`${styles.navItemText} ${collapsed ? styles.navItemTextHidden : ""}`}>
                Upgrade Plan
              </span>
            </Link>
            <Link
              href="/dashboard/about"
              className={`${styles.navItem} ${pathname === '/dashboard/about' ? styles.active : ""}`}
            >
              <Info size={20} />
              <span className={`${styles.navItemText} ${collapsed ? styles.navItemTextHidden : ""}`}>
                About Pixie
              </span>
            </Link>
            <Link
              href="/dashboard/support"
              className={`${styles.navItem} ${pathname === '/dashboard/support' ? styles.active : ""}`}
            >
              <HelpCircle size={20} />
              <span className={`${styles.navItemText} ${collapsed ? styles.navItemTextHidden : ""}`}>
                Help & Support
              </span>
            </Link>
          </div>
        </nav>
        {/* Ctrl+K Trigger Button */}
        <div className={styles.cmdPaletteTriggerWrapper}>
          <button 
            className={styles.cmdPaletteTrigger}
            onClick={() => setCmdOpen(true)}
            title="Open command palette (Ctrl+K)"
            type="button"
          >
            <Search size={16} className={styles.cmdSearchIcon} />
            <span className={`${styles.cmdTriggerText} ${collapsed ? styles.cmdTriggerTextHidden : ""}`}>
              Search tools...
            </span>
            <span className={`${styles.cmdTriggerBadge} ${collapsed ? styles.cmdTriggerBadgeHidden : ""}`}>
              ⌘K
            </span>
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={`${styles.quotaBox} ${collapsed ? styles.quotaBoxCollapsed : ""}`}>
            {collapsed ? (
              <div className={styles.collapsedQuotaContent}>
                <svg className={styles.progressRing} width="40" height="40">
                  <circle
                    className={styles.progressRingCircleBg}
                    stroke="rgba(0, 0, 0, 0.05)"
                    strokeWidth="3"
                    fill="transparent"
                    r="16"
                    cx="20"
                    cy="20"
                  />
                  <circle
                    className={styles.progressRingCircle}
                    stroke="url(#quotaGradient)"
                    strokeWidth="3"
                    strokeDasharray="100.53"
                    strokeDashoffset={100.53 - (percentage / 100) * 100.53}
                    strokeLinecap="round"
                    fill="transparent"
                    r="16"
                    cx="20"
                    cy="20"
                  />
                  <defs>
                    <linearGradient id="quotaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.collapsedIcon}>
                  {isUnlimited ? <Sparkles size={14} className={styles.sparkleActive} /> : <Wand2 size={14} />}
                </div>

                {/* Premium Glassmorphic Tooltip */}
                <div className={styles.quotaTooltip}>
                  <span className={styles.tooltipHeader}>
                    {user ? (isUnlimited ? "Unlimited Plan" : "Daily Quota") : "Guest Quota"}
                  </span>
                  <span className={styles.tooltipValue}>
                    {loading ? '...' : (isUnlimited ? "∞ Prompts" : `${remaining} / ${limit} Left`)}
                  </span>
                  {isUnlimited ? (
                    <span className={styles.tooltipAction}>Active Forever</span>
                  ) : user ? (
                    <Link href="/dashboard/upgrade" className={styles.tooltipAction} style={{ textDecoration: 'none' }}>
                      Unlock Unlimited
                    </Link>
                  ) : (
                    <Link href="/login" className={styles.tooltipAction} style={{ textDecoration: 'none' }}>
                      Sign In for More
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                {user ? (
                  <>
                    <div className={styles.quotaHeader}>
                      <span>Daily Quota</span>
                      <span>{loading ? '...' : (isUnlimited ? '∞' : `${authLimit - authPromptsUsed} / ${authLimit} Left`)}</span>
                    </div>
                    <div className={styles.quotaBar}>
                      <div 
                        className={styles.quotaFill} 
                        style={{ 
                          width: isUnlimited ? '100%' : `${Math.max(0, ((authLimit - authPromptsUsed) / authLimit) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    {!isUnlimited && (
                      <Link href="/dashboard/upgrade" style={{ width: '100%' }}>
                        <button className={styles.upgradeBtn}>Unlock Unlimited</button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.quotaHeader}>
                      <span>Guest Quota</span>
                      <span>{loading ? '...' : `${guestRemaining} / ${guestLimit} Left`}</span>
                    </div>
                    <div className={styles.quotaBar}>
                      <div className={styles.quotaFill} style={{ width: `${(guestRemaining / guestLimit) * 100}%` }}></div>
                    </div>
                    <Link href="/login" style={{ width: '100%', textDecoration: 'none' }}>
                      <button className={styles.upgradeBtn}>Sign In for More</button>
                    </Link>
                    <span className={styles.quotaNotice}>All tools work 100% free without an account</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      <nav className={styles.mobileBottomBar}>
        {navItems.slice(0, 5).map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : (pathname === item.href || pathname.startsWith(item.href + '/'));
            
          return (
            <Link key={item.href} href={item.href} className={`${styles.mobileTab} ${isActive ? styles.activeTab : ""}`}>
              <item.icon size={24} />
              <span>{item.name === "Dashboard" ? "Home" : item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileMoreOpen(true)} className={`${styles.mobileTab} ${mobileMoreOpen ? styles.activeTab : ""}`}>
          <Menu size={24} />
          <span>More</span>
        </button>
      </nav>

      {/* --- MOBILE BOTTOM SHEET (MORE MENU) --- */}
      <div className={`${styles.mobileSheetOverlay} ${mobileMoreOpen ? styles.open : ""}`} onClick={() => setMobileMoreOpen(false)}></div>
      <div className={`${styles.mobileSheet} ${mobileMoreOpen ? styles.open : ""}`}>
        <div className={styles.sheetHeader}>
          <div className={styles.logo}>
            <Image 
              src={logoFullPath} 
              alt="Pixie Logo" 
              width={110} 
              height={43} 
              priority 
              className={styles.logoImg}
              style={{ height: 'auto' }}
            />
          </div>
          <button className={styles.iconBtn} onClick={() => setMobileMoreOpen(false)}><X size={24} /></button>
        </div>
        <div className={styles.sheetContent}>
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>More Tools</span>
            {navItems.slice(5).map((item) => (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.quotaBox}>
              {user ? (
                <>
                  <div className={styles.quotaHeader}>
                    <span>Daily Quota</span>
                    <span>{loading ? '...' : (isUnlimited ? '∞' : `${authLimit - authPromptsUsed} / ${authLimit} Left`)}</span>
                  </div>
                  <div className={styles.quotaBar}>
                    <div 
                      className={styles.quotaFill} 
                      style={{ 
                        width: isUnlimited ? '100%' : `${Math.max(0, ((authLimit - authPromptsUsed) / authLimit) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  {!isUnlimited && (
                    <Link href="/dashboard/upgrade" style={{ width: '100%' }}>
                      <button className={styles.upgradeBtn}>Unlock Unlimited</button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.quotaHeader}>
                    <span>Guest Quota</span>
                    <span>{loading ? '...' : `${guestRemaining} / ${guestLimit} Left`}</span>
                  </div>
                  <div className={styles.quotaBar}>
                    <div className={styles.quotaFill} style={{ width: `${(guestRemaining / guestLimit) * 100}%` }}></div>
                  </div>
                  <Link href="/login" style={{ width: '100%', textDecoration: 'none' }}>
                    <button className={styles.upgradeBtn}>Sign In for More</button>
                  </Link>
                  <span className={styles.quotaNotice}>All tools work 100% free without an account</span>
                </>
              )}
            </div>

            <Link href={user ? "/dashboard" : "/login"} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.userProfile}>
                <UserCircle size={24} className={styles.userIcon} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user ? user.email?.split('@')[0] : "Guest User"}</span>
                  <span className={styles.userPlan} style={{ color: user ? 'var(--mint-green)' : 'var(--text-muted)' }}>
                    {user ? "Active Account" : "Login / Setup"}
                  </span>
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/dashboard/settings" className={styles.logOutBtn} style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                <Settings size={16} /> Settings
              </Link>
              {user ? (
                <button onClick={handleSignOut} className={styles.logOutBtn} style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <Link href="/login" className={styles.logOutBtn} style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                  <LogOut size={16} /> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* -------------------- */}

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          {/* Mobile Brand (hidden on desktop) */}
          <div className={`${styles.mobileBrand} ${styles.mobileOnly}`}>
            <Image 
              src={logoFullPath} 
              alt="Pixie Logo" 
              width={90} 
              height={35} 
              priority 
              className={styles.logoImg}
              style={{ height: 'auto' }}
            />
          </div>

          <div className={styles.breadcrumbs}>
            {pathname.split('/').filter(Boolean).map((path, idx, arr) => {
              const routeTo = `/${arr.slice(0, idx + 1).join('/')}`;
              const isLast = idx === arr.length - 1;
              const label = path.charAt(0).toUpperCase() + path.slice(1);
              return (
                <span key={path}>
                  {idx > 0 && <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>}
                  {isLast ?
                    <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{label}</span> :
                    <Link href={routeTo} style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>{label}</Link>
                  }
                </span>
              );
            })}
          </div>
          <div className={styles.topbarActions}>
            <button 
              onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={styles.iconBtn}
              title={mounted ? `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode` : "Toggle Theme"}
            >
              {!mounted ? (
                <Moon size={22} style={{ opacity: 0.5 }} />
              ) : theme === 'dark' ? (
                <Sun size={22} />
              ) : (
                <Moon size={22} />
              )}
            </button>

            <div ref={profileRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)} 
                className={`${styles.iconBtn} ${profileOpen ? styles.activeIcon : ""}`}
              >
                <UserCircle size={22} />
              </button>
              
              {profileOpen && (
                <div className={styles.profilePopup}>
                  <div className={styles.popupHeader}>
                    <div className={user ? styles.popupUserIcon : `${styles.popupUserIcon} ${styles.isGuest}`}>
                      <UserCircle size={32} />
                    </div>
                    <div className={styles.popupUserInfo}>
                      <span className={styles.popupEmail}>{user ? user.email : "Guest Session"}</span>
                      <span className={styles.popupPlan}>{user ? (isUnlimited ? "Unlimited Magic" : "Basic Tier") : "Limited Access"}</span>
                    </div>
                  </div>
                  
                  <div className={styles.popupQuota}>
                    <div className={styles.popupQuotaHeader}>
                      <span>{user ? (isUnlimited ? "Unlimited Magic" : "Daily Quota") : "Guest Quota"}</span>
                      {user ? (!isUnlimited && <span>{authPromptsUsed} / {authLimit}</span>) : <span>{guestRemaining} / {guestLimit}</span>}
                    </div>
                    <div className={styles.popupQuotaBar}>
                       <div className={styles.popupQuotaFill} style={{ width: user ? (isUnlimited ? '100%' : `${(authPromptsUsed/authLimit)*100}%`) : `${(guestRemaining/guestLimit)*100}%` }} />
                    </div>
                  </div>
                  
                  <div className={styles.popupLinks}>
                    {user ? (
                      <>
                        <Link href="/dashboard/settings" className={styles.popupLink} onClick={() => setProfileOpen(false)}>
                          <Settings size={18} /> <span>Settings</span>
                        </Link>
                        {!isUnlimited && (
                          <Link href="/dashboard/upgrade" className={`${styles.popupLink} ${styles.popupUpgrade}`} onClick={() => setProfileOpen(false)}>
                            <Wand2 size={18} /> <span>Upgrade Plan</span>
                          </Link>
                        )}
                        <button onClick={() => { handleSignOut(); setProfileOpen(false); }} className={styles.popupSignOut}>
                          <LogOut size={18} /> <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <Link href="/login" className={styles.popupLink} style={{ background: 'var(--mint-green)', color: 'var(--deep-charcoal)', border: 'none' }}>
                        <LogOut size={18} /> <span>Sign In / Register</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.workspaceContainer}>
          <div className={styles.workspace}>
            {children}
          </div>
        </main>
      </div>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
