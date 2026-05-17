"use client";

import { useState, useEffect } from "react";
import { Settings, User, Palette, Bell, Shield, HardDrive, Save, Trash2, AlertTriangle, X } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import styles from "./page.module.css";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState("Guest User");
  const [tierName, setTierName] = useState("Free Tier (Guest)");
  const [isAuth, setIsAuth] = useState(false);
  
  const { settings, updateSetting, saveAll, isLoaded } = useSettings();
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [cacheSize, setCacheSize] = useState<string>("Calculating...");
  const [isClearing, setIsClearing] = useState(false);

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevents hydration mismatch on themes
    
    // Fetch Active User
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuth(true);
        setDisplayName(user.email || "Magical User");
        setTierName(user.user_metadata?.tier === 'unlimited' ? "Unlimited Magic" : "Hobbyist (Free)");
      }
    });

    // Estimate cache tracking
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(({ usage }) => {
        if (usage) {
          const mb = (usage / (1024 * 1024)).toFixed(2);
          setCacheSize(`~${mb} MB cached (WASM cores + data)`);
        } else {
          setCacheSize("Memory usage tracking unavailable");
        }
      });
    } else {
      setCacheSize("Memory usage tracking unavailable");
    }
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      try {
        const databases = await indexedDB.databases();
        databases.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      } catch {}

      setCacheSize("~0.00 MB cached (Cleared)");
    } catch (e) {
      console.error(e);
      alert("Something went wrong clearing cache.");
    }
    setIsClearing(false);
  };

  const handleSave = () => {
    saveAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (!res.ok) throw new Error("Deletion Failed");
      
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Something went wrong attempting to delete account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Settings size={24} className={styles.headerIcon} />
          <h1>Settings</h1>
        </div>
        <p>Configure your Pixie workspace preferences.</p>
      </header>

      <div className={styles.sectionsGrid}>
        {/* Profile Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <User size={20} />
            <h2>Profile</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Account Email / Name</label>
              <input
                type="text"
                value={displayName}
                disabled={true}
                className={styles.textInput}
                style={{ opacity: 0.7 }}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Subscription Tier</label>
              <div className={styles.badge}>{tierName}</div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Palette size={20} />
            <h2>Appearance</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Color Theme</label>
              {mounted && (
                <Dropdown options={[{ label: "System Default", value: "system" }, { label: "Light (Soft Sage)", value: "light" }, { label: "Dark (Midnight Obsidian)", value: "dark" }]} value={theme} onChange={(val) => setTheme(val)} />
              )}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={20} />
            <h2>Notifications</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.toggleRow}>
              <span>Processing Alerts</span>
              <label className={styles.toggle}>
                <input 
                   type="checkbox" 
                   checked={settings.notifications} 
                   onChange={() => updateSetting('notifications', !settings.notifications)} 
                   disabled={!isLoaded}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Storage Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <HardDrive size={20} />
            <h2>Storage</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.toggleRow}>
              <span>Auto-Download Results</span>
              <label className={styles.toggle}>
                <input 
                  type="checkbox" 
                  checked={settings.autoDownload} 
                  onChange={() => updateSetting('autoDownload', !settings.autoDownload)} 
                  disabled={!isLoaded}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            <div className={styles.toggleRow}>
              <span>Auto-Copy Text Results</span>
              <label className={styles.toggle}>
                <input 
                  type="checkbox" 
                  checked={settings.autoCopy} 
                  onChange={() => updateSetting('autoCopy', !settings.autoCopy)} 
                  disabled={!isLoaded}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
              <label className={styles.label}>WASM Memory (Browser local)</label>
              <div className={styles.cacheInfo}>
                <span>{cacheSize}</span>
                <button 
                  className={styles.clearCacheBtn} 
                  onClick={handleClearCache}
                  disabled={isClearing}
                >
                  {isClearing ? "Clearing..." : "Clear Cache"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {isAuth && (
          <div className={styles.section} style={{ borderColor: 'var(--danger-border)' }}>
            <div className={styles.sectionHeader}>
              <Shield size={20} color="var(--danger-text)" />
              <h2 style={{ color: 'var(--danger-text)' }}>Danger Zone</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Permanently delete your account, tier access, and all associated metadata. This action cannot be undone.
              </p>
              <button 
                className={styles.deleteAccountBtn} 
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
 
      <button className={styles.saveBtn} onClick={handleSave}>
        <Save size={18} />
        {saved ? "Saved!" : "Save Preferences"}
      </button>
 
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModalBtn} onClick={() => setShowDeleteModal(false)}>
              <X size={20} />
            </button>
            <AlertTriangle size={48} color="var(--danger-text)" style={{ margin: "0 auto 1rem", display: "block" }} />
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem", color: "var(--foreground)" }}>Are you absolutely sure?</h2>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              This will permanently purge your account from Pixie. Your Unlimited Magic tier (if purchased) will be invalidated.
            </p>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--foreground)" }}>
              Please type <strong>DELETE</strong> to confirm.
            </label>
            <input 
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className={styles.textInput}
              style={{ marginBottom: "1.5rem" }}
            />
            <button 
              className={styles.confirmDeleteBtn}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Purging..." : "Permanently Delete Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
