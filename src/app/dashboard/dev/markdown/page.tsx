"use client";

import { useState, useEffect } from "react";
import { Copy, FileCode2, Check, Wand2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { marked } from "marked";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState("# Hello Markdown\n\nStart typing to see the **preview** rendered in real-time.");
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params }) => {
    if (params.inputText) setMarkdown(params.inputText);
  }, "/dashboard/dev/markdown");

  useEffect(() => {
    // using async parse
    Promise.resolve(marked.parse(markdown)).then(parsed => {
      setHtml(parsed as string);
    });
  }, [markdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Markdown Previewer" description="Write markdown and see it instantly rendered to formatted HTML." icon={FileCode2}>

      <div className={styles.workspace}>
        <div className={styles.editorArea} style={{ flexDirection: 'row', gap: '1rem' }}>
          <div className={styles.textPanel} style={{ flex: 1 }}>
            <div className={styles.panelHeader}>Markdown Source</div>
            <textarea
              className={styles.textarea}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type your markdown here..."
            />
          </div>
          
          <div className={styles.textPanel} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <div className={styles.panelHeader}>HTML Preview</div>
            <div 
              style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, color: 'var(--foreground)' }}
              dangerouslySetInnerHTML={{ __html: html }}
              className="prose dark:prose-invert"
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Export Options</h2>
          </div>
          <div className={styles.configBody}>

            <div className={styles.infoBox}>
              <strong>Real-time Parsing</strong>
              Markdown is parsed securely using the `marked` library locally.
            </div>

            <button className={styles.actionBtnAlt} onClick={handleCopy} disabled={!html}>
              {copied ? <><Check size={18} /> Copied HTML!</> : <><Copy size={18} /> Copy HTML Code</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => setMarkdown("")}
              style={{ marginTop: 'auto' }}
            >
              Clear Workspace
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

