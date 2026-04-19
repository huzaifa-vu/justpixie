"use client";
import { useState, useEffect } from "react";
import { Copy, FileCode2, Check, Wand2, Download, FileText, BarChart3, Clock, Trash2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { marked } from "marked";
import devStyles from "../dev.module.css";
import mStyles from "./markdown.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { motion, AnimatePresence } from "framer-motion";

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState("# Hello Markdown\n\nWrite your content here and see it rendered in the **Studio Preview** stage instantly.\n\n### Features:\n- **Real-time Stats** below the editor\n- **Side-by-side** workspace layout\n- **HTML vs Compiled** toggle in preview\n- **One-click** export and downloads");
  const [html, setHtml] = useState("");
  const [activeTab, setActiveTab] = useState<"render" | "html">("render");
  const [copiedMode, setCopiedMode] = useState<"md" | "html" | "">("");
  const { settings } = useSettings();

  useAiHydration(({ params }) => {
    if (params.inputText) setMarkdown(params.inputText);
  }, "/dashboard/dev/markdown");

  useEffect(() => {
    Promise.resolve(marked.parse(markdown)).then(parsed => {
      setHtml(parsed as string);
    });
  }, [markdown]);

  const handleCopy = (content: string, mode: "md" | "html") => {
    navigator.clipboard.writeText(content);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(""), 2000);
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const chars = markdown.length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <ToolWrapper title="Markdown Studio" description="Advanced markdown writing environment with real-time rendering and professional stats." icon={FileCode2}>
      <div className={mStyles.studioWrapper}>
        <div className={mStyles.editorStage}>
          <div className={devStyles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <FileText size={16} /> Markdown Source
            </div>
          </div>
          <textarea
            className={devStyles.textarea}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
            spellCheck={false}
          />
          <div className={mStyles.statsBar}>
             <div className={mStyles.statItem}><BarChart3 size={14} /> <span className={mStyles.statValue}>{words}</span> words</div>
             <div className={mStyles.statItem}><FileCode2 size={14} /> <span className={mStyles.statValue}>{chars}</span> chars</div>
             <div className={mStyles.statItem}><Clock size={14} /> <span className={mStyles.statValue}>{readTime}</span> min read</div>
          </div>
        </div>

        <div className={mStyles.previewStage}>
          <div className={mStyles.previewHeader}>
            <div className={mStyles.previewTabContainer}>
               <button 
                 onClick={() => setActiveTab("render")} 
                 className={`${mStyles.previewTab} ${activeTab === 'render' ? mStyles.activeTab : ''}`}
               >Live Preview</button>
               <button 
                 onClick={() => setActiveTab("html")} 
                 className={`${mStyles.previewTab} ${activeTab === 'html' ? mStyles.activeTab : ''}`}
               >HTML Source</button>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
               {activeTab === 'render' ? 'Compiled Document' : 'Raw Markup'}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {activeTab === 'render' ? (
              <motion.div 
                key="render"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={mStyles.previewContent}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <motion.div 
                key="html"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={mStyles.htmlSource}
              >
                {html}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={devStyles.configSidebar}>
          <div className={devStyles.configHeader}>
            <Wand2 size={20} />
            <h2>Alchemist Studio</h2>
          </div>
          <div className={devStyles.configBody}>
            <div className={devStyles.fieldGroup}>
              <label className={devStyles.label}>Clipboard Actions</label>
              <button 
                className={devStyles.actionBtnAlt} 
                onClick={() => handleCopy(markdown, "md")}
              >
                {copiedMode === 'md' ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Markdown</>}
              </button>
              <button 
                className={devStyles.actionBtnAlt} 
                onClick={() => handleCopy(html, "html")}
                style={{ background: 'var(--soft-sage)', border: '1px solid var(--border)' }}
              >
                {copiedMode === 'html' ? <><Check size={18} /> Copied!</> : <><FileCode2 size={18} /> Copy HTML Result</>}
              </button>
            </div>

            <div className={devStyles.fieldGroup}>
              <label className={devStyles.label}>File Management</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                  className={devStyles.copyBtn} 
                  onClick={() => handleDownload(markdown, `pixie-${Date.now()}.md`, "text/markdown")}
                  style={{ fontSize: '0.75rem' }}
                >
                  <Download size={14} /> MD File
                </button>
                <button 
                  className={devStyles.copyBtn} 
                  onClick={() => handleDownload(html, `pixie-${Date.now()}.html`, "text/html")}
                  style={{ fontSize: '0.75rem' }}
                >
                  <FileCode2 size={14} /> HTML File
                </button>
              </div>
            </div>

            <button 
              className={devStyles.copyBtn} 
              onClick={() => setMarkdown("")}
              style={{ marginTop: 'auto', color: '#ef4444', borderColor: '#fee2e2' }}
            >
              <Trash2 size={18} /> Reset Stage
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
