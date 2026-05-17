"use client";

import { useState } from "react";
import { Check, Sparkles, HelpCircle, ArrowRight, ChevronDown, X as XIcon, Compass, User, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isLifetime, setIsLifetime] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLifetime(session?.user?.user_metadata?.is_lifetime === true);
    });
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }
      const response = await fetch("/api/checkout", { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate checkout link");
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Something went wrong connecting to the checkout server. Please try again.");
      setLoading(false);
    }
  };

  const faqItems = [
    {
      q: "What exactly is a \"Spell\"?",
      a: "A \"Spell\" refers to an AI Prompt. When you type \"Remove the background from this image\", our AI engine parses your request, routes you to the correct tool, and automatically configures it. This consumes 1 AI Prompt."
    },
    {
      q: "Are my files actually private?",
      a: "100%. Pixie runs transformations like Background Removal and Image Compression directly in your browser using WASM (WebAssembly). We strictly use our AI only to parse your instructions — your files never leave your device."
    },
    {
      q: "Is this really a one-time payment?",
      a: "Yes! Upgrading to Unlimited Magic grants you lifetime access to unlimited AI Prompt parsing without any recurring subscriptions or hidden bandwidth fees."
    },
    {
      q: "Can I use the tools without writing prompts?",
      a: "Absolutely. You can manually navigate to any of our 30+ utilities via the dashboard menu and use them without consuming any AI Prompts whatsoever."
    },
    {
      q: "Do you support team or API access?",
      a: "Currently, Pixie is designed for individual power users. If you are interested in commercial API access, please reach out via our contact options!"
    },
    {
      q: "What if I exceed my 100 free prompts?",
      a: "Free tier users will fall back to manual tool navigation for the remainder of the day once their prompt limit is reached. The limit automatically resets every 24 hours."
    },
  ];

  return (
    <div className={styles.dashboardPricing}>
      <div className={styles.headerArea}>
        <div className={styles.badge}><Sparkles size={16} /> Unlock your full potential</div>
        <h1 className={styles.title}>Simple pricing, <br/><span className={styles.titleHighlight}>magical results.</span></h1>
        <p className={styles.subtitle}>
          Pixie's core tools will always be free. Upgrade to Unlimited Magic for heavy-duty AI usage and priority processing.
        </p>
      </div>

      <div className={styles.pricingGrid}>
        {/* Guest Tier */}
        <div className={styles.pricingCard}>
          <div className={styles.iconWrapper} style={{ '--accent-color': '#0ea5e9' } as React.CSSProperties}>
            <Compass size={28} />
          </div>
          <div className={styles.cardHeader}>
            <div className={styles.tierName}>Guest Explorer</div>
            <div className={styles.priceBlock}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>0</span>
              <span className={styles.period}>/no account</span>
            </div>
            <p className={styles.tierDesc}>Try out the tools without signing in.</p>
          </div>
          
          {!user ? (
            <div className={styles.planBtnOutline} style={{ cursor: 'default' }}>
              Current Plan
            </div>
          ) : (
            <div className={styles.planBtnOutlineDisabled} style={{ opacity: 0.5 }}>
              Free Tier
            </div>
          )}

          <ul className={styles.featuresList}>
            <li><Check size={18} className={styles.checkIcon} /> Standard File Tools</li>
            <li><Check size={18} className={styles.checkIcon} /> Local WASM processing</li>
            <li><Check size={18} className={styles.checkIcon} /> <strong>10 AI Prompts Daily</strong></li>
            <li className={styles.disabledFeature}><XIcon size={18} className={styles.xIcon} /> Unlimited AI Prompts</li>
            <li className={styles.disabledFeature}><XIcon size={18} className={styles.xIcon} /> Account Sync</li>
          </ul>
        </div>

        {/* Hobbyist Tier */}
        <div className={styles.pricingCard}>
          <div className={styles.iconWrapper} style={{ '--accent-color': '#8b5cf6' } as React.CSSProperties}>
            <User size={28} />
          </div>
          <div className={styles.cardHeader}>
            <div className={styles.tierName}>Hobbyist</div>
            <div className={styles.priceBlock}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>0</span>
              <span className={styles.period}>/forever</span>
            </div>
            <p className={styles.tierDesc}>Perfect for exploring Pixie's magical file tools.</p>
          </div>
          
          {user && !isLifetime ? (
            <div className={styles.planBtnOutline} style={{ cursor: 'default' }}>
              Current Plan
            </div>
          ) : !user ? (
            <Link href="/login" className={styles.planBtnSolid} style={{ background: 'var(--deep-charcoal)', color: 'white' }}>
              Login to Upgrade
            </Link>
          ) : (
            <div className={styles.planBtnOutlineDisabled} style={{ opacity: 0.5 }}>
              Free Tier
            </div>
          )}

          <ul className={styles.featuresList}>
            <li><Check size={18} className={styles.checkIcon} /> All 30+ File Tools forever</li>
            <li><Check size={18} className={styles.checkIcon} /> Local-first WASM processing</li>
            <li><Check size={18} className={styles.checkIcon} /> <strong>100 Free AI Prompts Daily</strong></li>
            <li className={styles.disabledFeature}><XIcon size={18} className={styles.xIcon} /> Unlimited AI Prompts</li>
            <li className={styles.disabledFeature}><XIcon size={18} className={styles.xIcon} /> Priority Processing</li>
          </ul>
        </div>

        {/* Unlimited Magic Tier */}
        <div className={`${styles.pricingCard} ${styles.popularCard}`}>
          <div className={styles.popularBadge}>Most Popular</div>
          <div className={styles.iconWrapper} style={{ '--accent-color': 'var(--mint-green)' } as React.CSSProperties}>
            <Crown size={28} />
          </div>
          <div className={styles.cardHeader}>
            <div className={styles.tierName}>Unlimited Magic</div>
            <div className={styles.priceBlock}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>19</span>
              <span className={styles.period}>/lifetime</span>
            </div>
            <p className={styles.tierDesc}>One single payment. Unlimited magic forever.</p>
          </div>
          
          {isLifetime ? (
            <div className={styles.planBtnOutline} style={{ border: '2px solid var(--mint-green)', color: 'var(--mint-green)', cursor: 'default' }}>
              Current Plan
            </div>
          ) : (
            <button 
              className={styles.planBtnSolid} 
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Warming up..." : user ? "Unlock Lifetime Access" : "Sign In to Buy"} <ArrowRight size={18} />
            </button>
          )}

          <ul className={styles.featuresList}>
            <li><Check size={18} className={styles.checkIcon} /> <strong>Unlimited AI Prompts</strong></li>
            <li><Check size={18} className={styles.checkIcon} /> Intelligent File Routing Engine</li>
            <li><Check size={18} className={styles.checkIcon} /> Priority Conversion Queue</li>
            <li><Check size={18} className={styles.checkIcon} /> All 30+ File Tools forever</li>
            <li><Check size={18} className={styles.checkIcon} /> Local-first WASM processing</li>
          </ul>
        </div>
      </div>

      {/* Interactive FAQ */}
      <div className={styles.faq}>
        <h2><HelpCircle size={24} style={{ color: 'var(--mint-green)', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqItems.map((item, idx) => (
            <div key={idx} className={`${styles.faqItem} ${openFaq === idx ? styles.faqItemOpen : ''}`}>
              <button className={styles.faqHeader} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span>{item.q}</span>
                <ChevronDown size={20} className={`${styles.faqChevron} ${openFaq === idx ? styles.faqChevronOpen : ''}`} />
              </button>
              <div className={`${styles.faqAnswer} ${openFaq === idx ? styles.faqAnswerOpen : ''}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
