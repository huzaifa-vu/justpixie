"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Wand2, Play, Square, Pause, Settings2 } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../../dev/dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";


export default function TextToSpeech() {
    const [autoRun, setAutoRun] = useState(false);
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // default to first google or english voice if possible
        const defaultVoice = availableVoices.find(v => v.name.includes("Google") || v.lang.startsWith("en")) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };
    
    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }

    return () => {
      synth.cancel();
    };
  }, []);

  useAiHydration(({ params, autoExecute }) => {
    if (params?.inputText) setText(String(params.inputText));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/text/speech");

  useEffect(() => {
    if (autoRun && text.trim() && voices.length > 0) {
      handlePlay();
      setAutoRun(false);
    }
  }, [autoRun, text, voices]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    if (synth.paused && isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    if (!text.trim()) return;

    synth.cancel(); // stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <ToolWrapper title="Text to Speech" description="Convert blocks of text to lifelike audio natively in-browser." icon={Mic}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Script Text</div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste the text you want to be read out loud..."
              style={{ fontSize: '1.125rem' }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Settings2 size={20} />
            <h2>Synthesizer</h2>
          </div>
          <div className={styles.configBody}>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Voice</span>
              <Dropdown 
                options={voices.map(v => ({ label: `${v.name} (${v.lang})`, value: v.name }))} 
                value={selectedVoice} 
                onChange={val => setSelectedVoice(val)} 
              />
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                <span className={styles.label}>Speed: {rate}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="2" step="0.1" 
                value={rate} 
                onChange={e => setRate(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--mint-green)', width: '100%', height: '6px' }} 
              />
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                <span className={styles.label}>Pitch: {pitch}</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.1" 
                value={pitch} 
                onChange={e => setPitch(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--mint-green)', width: '100%', height: '6px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {!isSpeaking ? (
                <button 
                  className={styles.actionBtnAlt} 
                  onClick={handlePlay} 
                  disabled={!text.trim() && !isPaused}
                  style={{ flex: 2 }}
                >
                  <Play fill="currentColor" size={20} /> Play
                </button>
              ) : (
                <button 
                  className={styles.actionBtnAlt} 
                  onClick={handlePause} 
                  style={{ flex: 2 }}
                >
                  <Pause fill="currentColor" size={20} /> Pause
                </button>
              )}
              
              <button 
                className={styles.copyBtn} 
                onClick={handleStop}
                disabled={!isSpeaking && !isPaused}
                style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
              >
                <Square fill="currentColor" size={20} />
              </button>
            </div>

            <div className={styles.infoBox}>
               Available voices are natively provided by your local Operating System (Windows/macOS) and your active web browser.
            </div>
            
            <button 
              className={styles.copyBtn} 
              onClick={() => { setText(""); handleStop(); }}
              style={{ marginTop: 'auto' }}
            >
              Clear Text
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

