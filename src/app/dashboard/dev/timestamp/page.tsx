"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw, ArrowRight } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../dev.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function TimestampConverter() {
  const router = useRouter();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  
  // Custom parsing
  const [epochInput, setEpochInput] = useState("");
  const [epochResult, setEpochResult] = useState("");
  
  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState("");
  const { settings } = useSettings();
  const [autoRun, setAutoRun] = useState(false);

  useAiHydration(({ params, autoExecute }) => {
    if (params.epoch) setEpochInput(params.epoch);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/dev/timestamp");

  useEffect(() => {
    if (autoRun && epochInput) {
      handleEpochConvert();
      setAutoRun(false);
    }
  }, [autoRun, epochInput]);

  useEffect(() => {
    if (epochResult && !epochResult.includes("Invalid") && settings.autoCopy) {
      navigator.clipboard.writeText(epochResult);
    }
  }, [epochResult, settings.autoCopy]);

  useEffect(() => {
    if (dateResult && !dateResult.includes("Invalid") && settings.autoCopy) {
      navigator.clipboard.writeText(dateResult);
    }
  }, [dateResult, settings.autoCopy]);

  useEffect(() => {
    const int = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(int);
  }, []);

  const handleEpochConvert = () => {
    const val = Number(epochInput);
    if (isNaN(val) || !val) {
      setEpochResult("Invalid Epoch");
      return;
    }
    // Handle milliseconds vs seconds
    const date = new Date(val > 1e11 ? val : val * 1000);
    setEpochResult(date.toUTCString() + " | Local: " + date.toLocaleString());
  };

  const handleDateConvert = () => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      setDateResult("Invalid Date Format");
      return;
    }
    setDateResult(Math.floor(date.getTime() / 1000).toString());
  };

  return (
    <ToolWrapper title="Unix Timestamp" description="Convert absolute Unix epoch time easily." icon={Clock}>

      <div className={styles.workspace} style={{ flexDirection: 'column', gap: '2rem' }}>
        
        {/* Live Clock Panel */}
        <div style={{ background: 'var(--surface-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Current Unix Epoch Time</div>
          <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 800, color: 'var(--pixie-teal)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {now}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Epoch -> Human */}
          <div style={{ background: 'var(--surface-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Epoch to Human Date</h3>
            <input 
              type="text" 
              placeholder="e.g. 1672531199" 
              value={epochInput} 
              onChange={(e) => setEpochInput(e.target.value)}
              className={styles.textInput}
            />
            <button className={styles.actionBtnAlt} onClick={handleEpochConvert}>Convert to GMT/Local</button>
            {epochResult && (
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace', marginTop: '1rem', wordBreak: 'break-all' }}>
                {epochResult}
              </div>
            )}
          </div>

          {/* Human -> Epoch */}
          <div style={{ background: 'var(--surface-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Human Date to Epoch</h3>
            <input 
              type="text" 
              placeholder="e.g. 2024-01-01T00:00:00Z" 
              value={dateInput} 
              onChange={(e) => setDateInput(e.target.value)}
              className={styles.textInput}
            />
            <button className={styles.actionBtnAlt} onClick={handleDateConvert}>Convert to Epoch</button>
            {dateResult && (
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace', marginTop: '1rem', fontSize: '1.5rem', color: 'var(--pixie-teal)', wordBreak: 'break-all' }}>
                {dateResult}
              </div>
            )}
          </div>
        </div>

      </div>
    </ToolWrapper>
  );
}

