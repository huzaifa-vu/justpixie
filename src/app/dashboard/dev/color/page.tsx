"use client";
import { useState } from "react";
import { Palette, Copy, Check, Pipette } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export default function ColorConverter() {
  const [hex, setHex] = useState("#a7f3d0");
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState("");
  const { settings } = useSettings();
  useAiHydration(({ params }) => {
    if (params.inputText && params.inputText.startsWith('#')) {
      setHex(params.inputText);
      setInputValue(params.inputText);
    }
  }, "/dashboard/dev/color");

  useEffect(() => {
    if (hex && settings.autoCopy) {
      copy(hex, 'hex');
    }
  }, [hex, settings.autoCopy]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const cleanVal = val.trim();
    if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cleanVal)) {
      let h = cleanVal.startsWith('#') ? cleanVal : '#' + cleanVal;
      if (h.length === 4) h = '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
      setHex(h);
      return;
    }
    const rgbMatch = cleanVal.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1])));
      const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2])));
      const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3])));
      setHex(`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
      return;
    }
    const hslMatch = cleanVal.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/i);
    if (hslMatch) {
      const hStr = parseInt(hslMatch[1]) % 360;
      const sStr = Math.min(100, Math.max(0, parseInt(hslMatch[2]))) / 100;
      const lStr = Math.min(100, Math.max(0, parseInt(hslMatch[3]))) / 100;
      const c = (1 - Math.abs(2 * lStr - 1)) * sStr;
      const x = c * (1 - Math.abs((hStr / 60) % 2 - 1));
      const m = lStr - c / 2;
      let r = 0, g = 0, b = 0;
      if (0 <= hStr && hStr < 60) { r = c; g = x; b = 0; }
      else if (60 <= hStr && hStr < 120) { r = x; g = c; b = 0; }
      else if (120 <= hStr && hStr < 180) { r = 0; g = c; b = x; }
      else if (180 <= hStr && hStr < 240) { r = 0; g = x; b = c; }
      else if (240 <= hStr && hStr < 300) { r = x; g = 0; b = c; }
      else if (300 <= hStr && hStr < 360) { r = c; g = 0; b = x; }
      setHex(`#${Math.round((r + m) * 255).toString(16).padStart(2, '0')}${Math.round((g + m) * 255).toString(16).padStart(2, '0')}${Math.round((b + m) * 255).toString(16).padStart(2, '0')}`);
    }
  };

  const hexToRgb = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16); const g = parseInt(h.slice(3, 5), 16); const b = parseInt(h.slice(5, 7), 16);
    return { r, g, b };
  };
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break; case g: h = ((b - r) / d + 2) / 6; break; case b: h = ((r - g) / d + 4) / 6; break; } }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const [hovered, setHovered] = useState(false);
  const [hoveredHex, setHoveredHex] = useState(false);
  const [hoveredRgb, setHoveredRgb] = useState(false);
  const [hoveredHsl, setHoveredHsl] = useState(false);
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const copy = (val: string, label: string) => { 
    navigator.clipboard.writeText(val)
      .then(() => {
        setCopied(label); 
        setTimeout(() => setCopied(""), 1500); 
      })
      .catch((err) => {
        // Silently handle focus-related copy failures (e.g. background tab)
        if (err.name === 'NotAllowedError') return;
        console.warn("Clipboard copy failed:", err);
      });
  };

  return (
    <ToolWrapper title="Color Converter" description="Convert between HEX, RGB, and HSL color spaces." icon={Palette}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Color Picker</div>
            <div style={{padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Picker</label>
                  <div style={{ position: 'relative', width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, backgroundColor: hex }}>
                    <input 
                      type="color" 
                      value={hex} 
                      onChange={(e) => { setHex(e.target.value); setInputValue(e.target.value); }} 
                      style={{ position: 'absolute', top: '-10px', left: '-10px', width: '100px', height: '100px', cursor: 'pointer', border: 'none', opacity: 0 }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Pipette size={20} color={hsl.l > 60 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} />
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Color Value</label>
                  <input type="text" value={inputValue} onChange={(e) => handleInputChange(e.target.value)} className={styles.textInput} placeholder="Hex, rgb(), or hsl()..." />
                </div>
              </div>

              <div 
                title={`Copy ${hex}`}
                onClick={() => copy(hex, 'preview')}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setHovered(false); }}
                style={{
                  width: '100%', 
                  height: '160px', 
                  backgroundColor: hex, 
                  borderRadius: 'var(--radius-inner)', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                  transition: 'transform 0.1s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {hovered && copied !== 'preview' && (
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundColor: 'rgba(0,0,0,0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'opacity 0.2s',
                    backdropFilter: 'blur(2px)'
                  }}>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <Copy size={16} /> Click to Copy
                    </span>
                  </div>
                )}
                {copied === 'preview' && (
                  <span style={{ position: 'relative', zIndex: 2, backgroundColor: '#000', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} /> Copied!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Palette size={20} /><h2>Conversions</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox} style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Copy size={12} /> Click value to copy
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>HEX</label>
              <div 
                className={styles.hashOutput} 
                onClick={() => copy(hex, 'hex')} 
                onMouseEnter={() => setHoveredHex(true)}
                onMouseLeave={() => setHoveredHex(false)}
                style={{cursor:'pointer', position: 'relative', overflow: 'hidden'}}
              >
                {hex}
                {hoveredHex && copied !== 'hex' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                    <span style={{ backgroundColor: 'var(--mint-green)', color: 'var(--deep-charcoal)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={10} /> CLICK TO COPY
                    </span>
                  </div>
                )}
                {copied === 'hex' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--mint-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--deep-charcoal)', fontWeight: 700, fontSize: '0.75rem' }}>COPIED!</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>RGB</label>
              <div 
                className={styles.hashOutput} 
                onClick={() => copy(rgbStr, 'rgb')} 
                onMouseEnter={() => setHoveredRgb(true)}
                onMouseLeave={() => setHoveredRgb(false)}
                style={{cursor:'pointer', position: 'relative', overflow: 'hidden'}}
              >
                {rgbStr}
                {hoveredRgb && copied !== 'rgb' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                    <span style={{ backgroundColor: 'var(--mint-green)', color: 'var(--deep-charcoal)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={10} /> CLICK TO COPY
                    </span>
                  </div>
                )}
                {copied === 'rgb' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--mint-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--deep-charcoal)', fontWeight: 700, fontSize: '0.75rem' }}>COPIED!</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>HSL</label>
              <div 
                className={styles.hashOutput} 
                onClick={() => copy(hslStr, 'hsl')} 
                onMouseEnter={() => setHoveredHsl(true)}
                onMouseLeave={() => setHoveredHsl(false)}
                style={{cursor:'pointer', position: 'relative', overflow: 'hidden'}}
              >
                {hslStr}
                {hoveredHsl && copied !== 'hsl' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                    <span style={{ backgroundColor: 'var(--mint-green)', color: 'var(--deep-charcoal)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={10} /> CLICK TO COPY
                    </span>
                  </div>
                )}
                {copied === 'hsl' && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--mint-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--deep-charcoal)', fontWeight: 700, fontSize: '0.75rem' }}>COPIED!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

