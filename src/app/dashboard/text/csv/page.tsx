"use client";

import { useState, useEffect } from "react";
import { FileJson, FileSpreadsheet, Wand2, ArrowUpDown, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../../dev/dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function CsvJsonConverter() {
  const [inputData, setInputData] = useState("");
  const [outputData, setOutputData] = useState("");
  const [mode, setMode] = useState<"csv2json" | "json2csv">("csv2json");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  // AI Hydration — prefill input text and mode from Dashboard prompt
  useAiHydration(({ params }) => {
    if (params.inputText) setInputData(params.inputText);
    if (params.mode === "json2csv") setMode("json2csv");
    else if (params.mode === "csv2json") setMode("csv2json");
  }, "/dashboard/text/csv");

  // A basic CSV parser that respects double quotes inside columns
  const parseCSV = (str: string) => {
    const arr: string[][] = [];
    let quote = false;
    let col = 0, row = 0;
    
    for (let c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c+1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      
      if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
      if (cc === '"') { quote = !quote; continue; }
      if (cc === ',' && !quote) { ++col; continue; }
      if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
      if (cc === '\n' && !quote) { ++row; col = 0; continue; }
      if (cc === '\r' && !quote) { ++row; col = 0; continue; }
      
      arr[row][col] += cc;
    }
    return arr.filter(r => r.length > 0 && r.some(c => c.trim() !== ""));
  };

  useEffect(() => {
    if (!inputData.trim()) {
      setOutputData("");
      setErrorMsg("");
      return;
    }

    try {
      if (mode === "csv2json") {
        const rows = parseCSV(inputData.trim());
        if (rows.length < 2) throw new Error("Need at least a header row and one data row.");
        const headers = rows[0].map(h => h.trim());
        const json = rows.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, i) => { obj[header] = row[i] ? row[i].trim() : ""; });
          return obj;
        });
        setOutputData(JSON.stringify(json, null, 2));
      } else {
        const parsed = JSON.parse(inputData.trim());
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Input must be a non-empty JSON array of objects.");
        const headers = Object.keys(parsed[0]);
        const csvRows = [];
        // Header
        csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));
        // Rows
        for (const row of parsed) {
          csvRows.push(headers.map(h => {
             const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
             return `"${val.replace(/"/g, '""')}"`;
          }).join(","));
        }
        setOutputData(csvRows.join("\n"));
      }
      setErrorMsg("");
    } catch (e: any) {
      setErrorMsg(e.message || "Invalid syntax.");
    }
  }, [inputData, mode]);

  useEffect(() => {
    if (outputData && settings.autoCopy) {
      handleCopy();
    }
  }, [outputData, settings.autoCopy]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Data Converter" description="Instantly convert bulk arrays between CSV strings and JSON." icon={FileSpreadsheet}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                {mode === 'csv2json' ? <FileSpreadsheet size={16}/> : <FileJson size={16}/>}
                {mode === 'csv2json' ? "Input CSV" : "Input JSON"}
              </span>
              <button 
                onClick={() => setMode(mode === 'csv2json' ? 'json2csv' : 'csv2json')}
                style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                <ArrowUpDown size={16} /> Swap Format
              </button>
            </div>
            <textarea
              className={styles.textarea}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={mode === 'csv2json' ? "id,name,age\n1,John,30\n2,Jane,25" : '[\n  {\n    "id": "1",\n    "name": "John"\n  }\n]'}
            />
          </div>
          
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                {mode === 'csv2json' ? <FileJson size={16}/> : <FileSpreadsheet size={16}/>}
                {mode === 'csv2json' ? "Output JSON" : "Output CSV"}
              </span>
            </div>
            <textarea
              className={styles.textarea}
              value={outputData}
              readOnly
              placeholder="Conversion output appears here..."
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Configuration</h2>
          </div>
          <div className={styles.configBody}>

            {errorMsg && <div className={styles.statusBad}>{errorMsg}</div>}
            
            <div className={styles.infoBox}>
              <strong>Local Parser API</strong>
              Calculations stream internally as you type. Your data never leaves Chrome.
            </div>

            <button className={styles.actionBtnAlt} onClick={handleCopy} disabled={!outputData}>
              {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Result</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => {
                setInputData("");
              }}
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

