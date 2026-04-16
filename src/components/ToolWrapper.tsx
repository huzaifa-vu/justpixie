"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ToolStyles from "./ToolWrapper.module.css";

interface ToolWrapperProps {
  title: string;
  description: string;
  icon: any; // Lucide icon component
  children: React.ReactNode;
}

export default function ToolWrapper({ title, description, icon: Icon, children }: ToolWrapperProps) {
  const router = useRouter();

  return (
    <div className={ToolStyles.toolWrapper}>
      <header className={ToolStyles.header}>
        <div className={ToolStyles.titleRow}>
          <button 
            onClick={() => router.back()} 
            className={ToolStyles.backBtn}
            title="Go Back"
          >
            <ArrowLeft size={24} />
          </button>
          
          {Icon && (
            <div className={ToolStyles.iconBox}>
              <Icon size={20} />
            </div>
          )}
          
          <h1 className={ToolStyles.title}>
            {title}
          </h1>
        </div>
        <p className={ToolStyles.description}>
          {description}
        </p>
      </header>

      <div className={ToolStyles.content}>
        {children}
      </div>
    </div>
  );
}
