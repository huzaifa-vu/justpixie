"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, CornerDownLeft, Sparkles, Sun, Moon, LogOut, 
  Settings, Info, CreditCard, LayoutDashboard, History,
  FileImage, FileText, Film, Code, Type, Laptop, Wand2
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { TOOLS_REGISTRY, ToolEntry } from "@/utils/toolsRegistry";
import styles from "./CommandPalette.module.css";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  name: string;
  desc: string;
  type: string;
  href?: string;
  action?: () => void;
  icon: any;
  category: string;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState<ToolEntry[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load recents & auth state
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Load recents from localStorage
      const stored = localStorage.getItem("pixie_recent_spells");
      if (stored) {
        try {
          setRecents(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse recent spells", e);
        }
      }

      // Check auth state
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsLoggedIn(!!session?.user);
      }).catch(() => setIsLoggedIn(false));
    }
  }, [isOpen]);

  // Track click outside
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Compile all search items
  const allItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];

    // 1. Add all tools from registry
    Object.entries(TOOLS_REGISTRY).forEach(([catKey, tools]) => {
      tools.forEach((tool) => {
        let icon = Wand2;
        if (catKey === "image") icon = FileImage;
        if (catKey === "pdf") icon = FileText;
        if (catKey === "video") icon = Film;
        if (catKey === "dev") icon = Code;
        if (catKey === "text") icon = Type;

        list.push({
          id: `tool-${tool.href}`,
          name: tool.name,
          desc: tool.desc,
          type: tool.type,
          href: tool.href,
          icon,
          category: catKey
        });
      });
    });

    // 2. Add action commands
    list.push({
      id: "action-theme",
      name: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      desc: "Toggle light or dark visual aesthetic instantly.",
      type: "Action",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
      },
      icon: theme === "dark" ? Sun : Moon,
      category: "actions"
    });

    list.push({
      id: "action-dashboard",
      name: "Go to Dashboard",
      desc: "Return to the main workspace and AI prompt hub.",
      type: "Navigation",
      href: "/dashboard",
      icon: LayoutDashboard,
      category: "actions"
    });

    list.push({
      id: "action-settings",
      name: "Settings & Profile",
      desc: "Configure preferences and account details.",
      type: "Navigation",
      href: "/dashboard/settings",
      icon: Settings,
      category: "actions"
    });

    list.push({
      id: "action-about",
      name: "About Pixie",
      desc: "Learn about local sandboxed WebAssembly execution.",
      type: "Navigation",
      href: "/dashboard/about",
      icon: Info,
      category: "actions"
    });

    list.push({
      id: "action-pricing",
      name: "Pricing & Quotas",
      desc: "View Pixie limits, active spell tokens, and subscriptions.",
      type: "Navigation",
      href: "/pricing",
      icon: CreditCard,
      category: "actions"
    });

    if (isLoggedIn) {
      list.push({
        id: "action-logout",
        name: "Sign Out",
        desc: "Securely close your account session.",
        type: "Action",
        action: async () => {
          await supabase.auth.signOut();
          router.push("/login");
        },
        icon: LogOut,
        category: "actions"
      });
    }

    return list;
  }, [theme, isLoggedIn]);

  // Filtered list
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Return a set of default commands when empty: Recents + Actions
      const list: PaletteItem[] = [];
      
      // Load recents first
      recents.forEach((recent) => {
        let icon = Wand2;
        if (recent.href.includes("/image")) icon = FileImage;
        else if (recent.href.includes("/pdf")) icon = FileText;
        else if (recent.href.includes("/video")) icon = Film;
        else if (recent.href.includes("/dev")) icon = Code;
        else if (recent.href.includes("/text")) icon = Type;

        list.push({
          id: `recent-${recent.href}`,
          name: recent.name,
          desc: recent.desc,
          type: recent.type,
          href: recent.href,
          icon,
          category: "recent"
        });
      });

      // Append action items
      const actions = allItems.filter(item => item.category === "actions");
      list.push(...actions);

      return list;
    }

    return allItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  }, [searchQuery, allItems, recents]);

  // Keep active index in bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          handleSelect(filteredItems[activeIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [isOpen, filteredItems, activeIndex]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`.${styles.resultRowActive}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = (item: PaletteItem) => {
    // 1. Add to recents if it's a tool nav item
    if (item.href && item.category !== "actions" && item.category !== "recent") {
      const recentEntry: ToolEntry = {
        name: item.name,
        desc: item.desc,
        type: item.type,
        href: item.href
      };

      const nextRecents = [recentEntry, ...recents.filter(r => r.href !== item.href)].slice(0, 5);
      localStorage.setItem("pixie_recent_spells", JSON.stringify(nextRecents));
    }

    // 2. Navigate or execute action
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }

    // 3. Close palette
    onClose();
  };

  // Group by category helper for presentation
  const groupedItems = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {};
    filteredItems.forEach(item => {
      const groupName = item.category;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Mapping keys for category headers
  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case "recent": return "Recent Spells";
      case "actions": return "System Actions";
      case "image": return "Image Spells";
      case "pdf": return "PDF Spells";
      case "video": return "Video Alchemy";
      case "dev": return "Developer Spells";
      case "text": return "Text & Data";
      default: return cat;
    }
  };

  // Pre-calculate linear search indexing flat-mapping indices
  const getFlatIndex = (catKey: string, relativeIndex: number) => {
    let indexCount = 0;
    const keys = Object.keys(groupedItems);
    for (const key of keys) {
      if (key === catKey) {
        return indexCount + relativeIndex;
      }
      indexCount += groupedItems[key].length;
    }
    return relativeIndex;
  };

  const getBadgeColors = (cat: string) => {
    switch (cat) {
      case "image": return { bg: "rgba(208, 239, 255, 0.4)", text: "#007799" };
      case "pdf": return { bg: "rgba(255, 228, 230, 0.4)", text: "#E11D48" };
      case "video": return { bg: "rgba(224, 231, 255, 0.4)", text: "#4338CA" };
      case "dev": return { bg: "rgba(220, 252, 231, 0.4)", text: "#15803D" };
      case "text": return { bg: "rgba(253, 232, 239, 0.4)", text: "#BE185D" };
      case "recent": return { bg: "rgba(167, 243, 208, 0.4)", text: "#047857" };
      default: return { bg: "rgba(0,0,0,0.04)", text: "var(--text-muted)" };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className={styles.modalCard}
          >
            <div className={styles.searchHeader}>
              <Search size={20} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, settings, active engines..."
                className={styles.searchInput}
              />
              <span className={styles.escBadge}>ESC</span>
            </div>

            <div ref={listRef} className={styles.resultsList}>
              {filteredItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <Sparkles size={32} style={{ color: "var(--gentle-lilac)", opacity: 0.8 }} />
                  <span className={styles.emptyTitle}>No matching spells found</span>
                  <span className={styles.emptyText}>Try adjusting your parameters or looking for another local action.</span>
                </div>
              ) : (
                Object.entries(groupedItems).map(([catKey, items]) => (
                  <div key={catKey}>
                    <div className={styles.groupHeader}>{getCategoryTitle(catKey)}</div>
                    {items.map((item, relIdx) => {
                      const flatIdx = getFlatIndex(catKey, relIdx);
                      const isActive = flatIdx === activeIndex;
                      const badge = getBadgeColors(catKey);

                      return (
                        <div
                          key={item.id}
                          className={`${styles.resultRow} ${isActive ? styles.resultRowActive : ""}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                        >
                          <div className={styles.iconWrapper} style={{ background: badge.bg, color: badge.text }}>
                            <item.icon size={18} />
                          </div>
                          
                          <div className={styles.textContainer}>
                            <span className={styles.label}>{item.name}</span>
                            <span className={styles.desc}>{item.desc}</span>
                          </div>

                          {catKey !== "actions" && (
                            <span className={styles.categoryBadge} style={{ background: badge.bg, color: badge.text }}>
                              {item.type}
                            </span>
                          )}

                          {isActive && (
                            <span className={styles.enterHint}>
                              Select <CornerDownLeft size={10} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.instructions}>
                <div className={styles.instructionItem}>
                  <span className={styles.keyTag}>↑↓</span>
                  <span>Navigate</span>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.keyTag}>Enter</span>
                  <span>Select</span>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.keyTag}>Esc</span>
                  <span>Close</span>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", color: "var(--text-muted)", opacity: 0.8 }}>
                <Laptop size={12} />
                <span>Runs 100% locally</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
