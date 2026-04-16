"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wand2, LayoutDashboard, Image as ImageIcon, FileText, Video, Code, Settings, UserCircle, LogOut, Type, Menu, X, Info, HelpCircle, Sparkles, Download } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useQuota } from "@/hooks/useQuota";
import styles from "./layout.module.css";
import Image from "next/image";
import { FileDropProvider } from "@/contexts/FileDropContext";
import { GlobalDropOverlay } from "@/components/GlobalDropOverlay";

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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { guestUsed, guestLimit, guestRemaining, authPromptsUsed, isUnlimited, authLimit } = useQuota(user);

  useEffect(() => {
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
    { name: "Download Hub", href: "/dashboard/download", icon: Download },
    { name: "Dev Utilities", href: "/dashboard/dev", icon: Code },
    { name: "Text & Data", href: "/dashboard/text", icon: Type },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer' }}>
            <Wand2 className={styles.wandStar} size={28} />
            {!collapsed && <span>Pixie</span>}
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            {!collapsed && <span className={styles.groupLabel}>Tools</span>}
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
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          <div className={styles.navGroup} style={{ marginTop: '1.5rem' }}>
            {!collapsed && <span className={styles.groupLabel}>Account & Help</span>}
            <Link
              href="/dashboard/upgrade"
              className={`${styles.navItem} ${pathname === '/dashboard/upgrade' ? styles.active : ""}`}
            >
              <Sparkles size={20} />
              {!collapsed && <span>Upgrade Plan</span>}
            </Link>
            <Link
              href="/dashboard/about"
              className={`${styles.navItem} ${pathname === '/dashboard/about' ? styles.active : ""}`}
            >
              <Info size={20} />
              {!collapsed && <span>About Pixie</span>}
            </Link>
            <Link
              href="/dashboard/support"
              className={`${styles.navItem} ${pathname === '/dashboard/support' ? styles.active : ""}`}
            >
              <HelpCircle size={20} />
              {!collapsed && <span>Help & Support</span>}
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.quotaBox}>
            {!collapsed && user && (
              <>
                <div className={styles.quotaHeader}>
                  <span>Daily Quota</span>
                  <span>{isUnlimited ? '∞' : `${authPromptsUsed} / ${authLimit}`}</span>
                </div>
                <div className={styles.quotaBar}>
                  <div className={styles.quotaFill} style={{ width: isUnlimited ? '100%' : `${Math.min(100, (authPromptsUsed / authLimit) * 100)}%` }}></div>
                </div>
                {!isUnlimited && (
                  <Link href="/dashboard/upgrade" style={{ width: '100%' }}>
                    <button className={styles.upgradeBtn}>Unlock Unlimited</button>
                  </Link>
                )}
              </>
            )}
            {!collapsed && !user && (
               <>
                 <div className={styles.quotaHeader}>
                   <span>Guest Quota</span>
                   <span>{guestRemaining} / {guestLimit} Left</span>
                 </div>
                 <div className={styles.quotaBar}>
                   <div className={styles.quotaFill} style={{ width: `${(guestRemaining / guestLimit) * 100}%` }}></div>
                 </div>
                 <Link href="/login" style={{ width: '100%', textDecoration: 'none' }}>
                   <button className={styles.upgradeBtn}>Sign In for More</button>
                 </Link>
               </>
            )}
            {collapsed && <Wand2 size={24} className={styles.wandStar} />}
          </div>

        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      <nav className={styles.mobileBottomBar}>
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className={`${styles.mobileTab} ${pathname === item.href || pathname.startsWith(item.href + '/') ? styles.activeTab : ""}`}>
            <item.icon size={24} />
            <span>{item.name === "Dashboard" ? "Home" : item.name.split(" ")[0]}</span>
          </Link>
        ))}
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
            <Wand2 className={styles.wandStar} size={24} />
            <span>Pixie</span>
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
                    <span>{isUnlimited ? '∞' : `${authPromptsUsed} / ${authLimit}`}</span>
                  </div>
                  <div className={styles.quotaBar}>
                    <div className={styles.quotaFill} style={{ width: isUnlimited ? '100%' : `${Math.min(100, (authPromptsUsed / authLimit) * 100)}%` }}></div>
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
                    <span>{guestRemaining} / {guestLimit} Left</span>
                  </div>
                  <div className={styles.quotaBar}>
                    <div className={styles.quotaFill} style={{ width: `${(guestRemaining / guestLimit) * 100}%` }}></div>
                  </div>
                  <Link href="/login" style={{ width: '100%', textDecoration: 'none' }}>
                    <button className={styles.upgradeBtn}>Sign In for More</button>
                  </Link>
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
            <Wand2 className={styles.wandStar} size={22} />
            <span>Pixie</span>
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
    </div>
  );
}
