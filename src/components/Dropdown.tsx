"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  label: string;
  value: string | number;
  preview?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: any; // Can be string | number | (string | number)[]
  onChange: (val: any) => void;
  multiSelect?: boolean;
  placeholder?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  multiSelect = false,
  placeholder = "Select..."
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleOptionClick = (optionValue: string | number) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue: string | number) => {
    if (multiSelect) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const renderSelectedValue = () => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return placeholder;
      if (currentValues.length <= 2) {
        return (
          <div className={styles.tags}>
             {currentValues.map(v => {
                const opt = options.find(o => o.value === v);
                return <span key={v} className={styles.tag}>{opt?.label || v}</span>;
             })}
          </div>
        );
      }
      return `${currentValues.length} items selected`;
    } else {
      const opt = options.find(o => o.value === value);
      return opt ? opt.label : placeholder;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{renderSelectedValue()}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${isSelected(opt.value) ? styles.optionSelected : ""}`}
              onClick={() => handleOptionClick(opt.value)}
            >
              <div className={styles.optionContent}>
                {opt.preview && <span className={styles.optionPreview}>{opt.preview}</span>}
                <span>{opt.label}</span>
              </div>
              {isSelected(opt.value) && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
