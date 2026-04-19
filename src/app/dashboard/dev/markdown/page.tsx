"use client";
import { useState, useEffect } from "react";
import { Copy, FileCode2, Check, Wand2, Download, FileText, BarChart3, Clock, Trash2, Layout } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { marked } from "marked";
import devStyles from "../dev.module.css";
import mStyles from "./markdown.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { motion, AnimatePresence } from "framer-motion";

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState("# Hello Markdown\n\nWrite your content here and see it rendered in the **Studio Preview** stage instantly.\n\n### Features:\n- **Full-Width Workspace** for professional focus\n- **Action Ribbon** at the top for quick exports\n- **Real-time Stats** for document tracking\n- **Premium Rendering** design system");
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
    <ToolWrapper title="Markdown Studio" description="High-fidelity markdown environment with a full-width workspace and professional export tools." icon={FileCode2}>
      <div className={mStyles.studioWrapper}>
        
        {/* Top Action Ribbon */}
        <div className={mStyles.actionRibbon}>
          <div className={mStyles.ribbonSection}>
             <div className={mStyles.statsCapsule}>
               <div className={mStyles.statSegment}>
                  <BarChart3 size={14} /> 
                  <span className={mStyles.statValue}>{words}</span> words
               </div>
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
               <div className={mStyles.statSegment}>
                  <FileCode2 size={14} /> 
                  <span className={mStyles.statValue}>{chars}</span> chars
               </div>
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
               <div className={mStyles.statSegment}>
                  <Clock size={14} /> 
                  <span className={mStyles.statValue}>{readTime}m</span> read
               </div>
             </div>
          </div>

          <div className={mStyles.ribbonSection}>
            <button 
              className={`${devStyles.miniBtn} ${copiedMode === 'md' ? devStyles.miniBtnSuccess : ''}`} 
              onClick={() => handleCopy(markdown, "md")}
            >
              {copiedMode === 'md' ? <Check size={14} /> : <Copy size={14} />} {copiedMode === 'md' ? 'Copied' : 'Markdown'}
            </button>
            <button 
              className={`${devStyles.miniBtn} ${copiedMode === 'html' ? devStyles.miniBtnSuccess : ''}`} 
              onClick={() => handleCopy(html, "html")}
            >
              {copiedMode === 'html' ? <Check size={14} /> : <FileCode2 size={14} />} {copiedMode === 'html' ? 'Copied' : 'HTML Code'}
            </button>
            <div className={mStyles.separator} />
            <button className={devStyles.iconBtn} onClick={() => handleDownload(markdown, `pixie-${Date.now()}.md`, "text/markdown")} title="Download Markdown">
              <Download size={16} />
            </button>
            <button className={devStyles.iconBtn} onClick={() => handleDownload(html, `pixie-${Date.now()}.html`, "text/html")} title="Download HTML Code">
              <FileCode2 size={16} />
            </button>
            <button className={`${devStyles.iconBtn} ${devStyles.iconBtnDanger}`} onClick={() => setMarkdown("")} title="Reset Stage">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Workspace Split Stages */}
        <div className={mStyles.workspaceStages}>
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
                 Render Mode
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {activeTab === 'render' ? (
                <motion.div 
                  key="render"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={mStyles.previewContent}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <motion.div 
                  key="html"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={mStyles.htmlSource}
                >
                  {html}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
