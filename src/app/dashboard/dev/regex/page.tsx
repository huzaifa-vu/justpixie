"use client";

import { useState, useMemo } from "react";
import { TerminalSquare, Wand2, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("The quick brown fox jumps over the lazy dog. 12345");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params }) => {
    if (params.pattern) setPattern(params.pattern);
    if (params.inputText) setTestString(params.inputText);
  }, "/dashboard/dev/regex");

  const { resultHtml, error, matchesCount } = useMemo(() => {
    if (!pattern) return { resultHtml: testString, error: null, matchesCount: 0 };
    try {
      const regex = new RegExp(pattern, flags);
      let count = 0;
      
      // We need to highlight matches. 
      // If global flag is not set, it will infinite loop if we do exec in a loop, so we handle it:
      const safeRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');

      const matches = Array.from(testString.matchAll(safeRegex));
      count = matches.length;
      
      // Build HTML with highlights
      let html = "";
      let lastIndex = 0;
      for (const match of matches) {
        if (match[0] === "") break; // prevent infinite zero-length matches
        const start = match.index!;
        const end = start + match[0].length;
        
        // Add text before match
        html += testString.slice(lastIndex, start).replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Add highlighted match
        html += `<span style="background-color: rgba(167, 243, 208, 0.4); border-radius: 4px; border-bottom: 2px solid var(--mint-green);">${match[0].replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        
        lastIndex = end;
      }
      // Add remaining text
      html += testString.slice(lastIndex).replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return { resultHtml: html, error: null, matchesCount: count };
    } catch (err: any) {
      return { resultHtml: testString, error: err.message, matchesCount: 0 };
    }
  }, [pattern, flags, testString]);

  const handleCopyCode = () => {
    const code = `const regex = new RegExp('${pattern.replace(/'/g, "\\'")}', '${flags}');\nconst str = \`${testString.replace(/`/g, "\\`")}\`;\nconst matches = str.match(regex);`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Regex Tester" description="Test JavaScript regular expressions safely against sample strings." icon={TerminalSquare}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          
          <div className={styles.textPanel} style={{ flex: 0, height: '120px' }}>
             <div className={styles.panelHeader}>Regular Expression</div>
             <div className={styles.regexRow}>
                <span className={styles.regexSlash}>/</span>
                <input 
                  type="text" 
                  className={styles.textInput} 
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.25rem' }}
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  placeholder="pattern (e.g. \d+)"
                />
                <span className={styles.regexSlash}>/</span>
                <input 
                  type="text" 
                  className={`${styles.textInput} ${styles.regexFlagsInput}`}
                  value={flags}
                  onChange={e => setFlags(e.target.value)}
                  placeholder="gmi"
                />
             </div>
          </div>

          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Test String</div>
            <textarea
              className={styles.textarea}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste your text sequence here..."
              style={{ fontSize: '1.125rem' }}
            />
          </div>

          <div className={styles.textPanel} style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <div className={styles.panelHeader}>Match Result ({matchesCount} matches)</div>
            <div 
              style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, color: 'var(--foreground)', fontSize: '1.125rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              dangerouslySetInnerHTML={{ __html: resultHtml }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Overview</h2>
          </div>
          <div className={styles.configBody}>

            {error ? (
               <div className={styles.statusBad}>{error}</div>
            ) : (
               <div className={styles.statusGood}>Valid Expression</div>
            )}

            <button className={styles.actionBtnAlt} onClick={handleCopyCode} style={{ marginTop: '1rem' }}>
              {copied ? <><Check size={18} /> Copied Snippet!</> : <><Copy size={18} /> Copy Code Snippet</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => { setPattern(""); setTestString(""); }}
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

