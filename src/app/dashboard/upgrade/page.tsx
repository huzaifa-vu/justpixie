"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, HelpCircle, ArrowRight, ChevronDown, X as XIcon, Compass, User, Crown, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { createClient } from "@/utils/supabase/client";

export default function UpgradePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
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
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    // Open Patreon in a new tab
    window.open("https://patreon.com/u71272467", "_blank");
    
    // Show the Activation Wizard Modal
    setShowModal(true);
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent("Pixie Upgrade Request (Patreon)");
    const body = encodeURIComponent(
      `Hi Huzaifa,\n\nI just subscribed to the Unlimited Magic tier on Patreon!\n\nPlease activate my Pixie account.\n\nMy Pixie Account Email: ${user?.email || ""}\nMy Patreon Profile Name: [Write your Patreon name here]\n\nThank you!`
    );
    return `mailto:huzaifaramzan10@gmail.com?subject=${subject}&body=${body}`;
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
      q: "How does the Patreon subscription work?",
      a: "By supporting us at Patreon for just $1/month, you unlock Unlimited Magic. You can cancel at any time directly through Patreon with zero hassle."
    },
    {
      q: "How long does activation take?",
      a: "If you email us at huzaifaramzan10@gmail.com after subscribing, we will activate your account instantly. Otherwise, accounts are automatically matched and upgraded within 24–48 hours."
    },
    {
      q: "Can I use the tools without writing prompts?",
      a: "Absolutely. You can manually navigate to any of our 50+ utilities via the dashboard menu and use them without consuming any AI Prompts whatsoever."
    },
    {
      q: "What if I exceed my 100 free prompts?",
      a: "Free tier users will fall back to manual tool navigation for the remainder of the day once their prompt limit is reached. The limit resets automatically every 24 hours."
    },
  ];

  return (
    <div className={styles.dashboardPricing}>
      <div className={styles.headerArea}>
        <div className={styles.badge}><Sparkles size={16} /> Support Indie Devs</div>
        <h1 className={styles.title}>Simple pricing, <br/><span className={styles.titleHighlight}>magical results.</span></h1>
        <p className={styles.subtitle}>
          Pixie's core tools will always be free. Upgrade to Unlimited Magic for heavy-duty AI usage and priority local processing.
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
            <li><Check size={18} className={styles.checkIcon} /> <strong>3 AI Prompts Daily</strong></li>
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
            <Link href="/login" className={styles.planBtnSolid} style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
              Login to Upgrade
            </Link>
          ) : (
            <div className={styles.planBtnOutlineDisabled} style={{ opacity: 0.5 }}>
              Free Tier
            </div>
          )}

          <ul className={styles.featuresList}>
            <li><Check size={18} className={styles.checkIcon} /> All 50+ File Tools forever</li>
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
              <span className={styles.price}>1</span>
              <span className={styles.period}>/month</span>
            </div>
            <p className={styles.tierDesc}>Support on Patreon. Cancel anytime.</p>
          </div>
          
          {isLifetime ? (
            <div className={styles.planBtnOutline} style={{ border: '2px solid var(--mint-green)', color: 'var(--mint-green)', cursor: 'default' }}>
              Current Plan ✓
            </div>
          ) : (
            <button 
              className={styles.planBtnSolid} 
              onClick={handleUpgrade}
            >
              {user ? "Upgrade via Patreon" : "Sign In to Buy"} <ArrowRight size={18} />
            </button>
          )}

          <ul className={styles.featuresList}>
            <li><Check size={18} className={styles.checkIcon} /> <strong>Unlimited AI Prompts</strong></li>
            <li><Check size={18} className={styles.checkIcon} /> Intelligent File Routing Engine</li>
            <li><Check size={18} className={styles.checkIcon} /> Priority Conversion Queue</li>
            <li><Check size={18} className={styles.checkIcon} /> All 50+ File Tools forever</li>
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

      {/* Patreon Activation Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              className={styles.modalCloseBtn}
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              <XIcon size={20} />
            </button>
            
            <h2 className={styles.modalTitle}>
              <Sparkles size={24} style={{ color: "var(--mint-green)" }} /> Step 2: Activate Your Upgrade
            </h2>
            <p className={styles.modalSub}>
              We have opened Patreon in a new tab for you to subscribe. Once you complete your subscription, choose how you would like to activate your Unlimited Magic tier:
            </p>
            
            <div className={styles.stepsContainer}>
              <div className={styles.stepCard}>
                <div className={styles.stepNum}>A</div>
                <div className={styles.stepDetails}>
                  <h4 className={styles.stepTitle}>Instant Activation (Recommended)</h4>
                  <p className={styles.stepDesc}>
                    Click the button below to email me. I will manually upgrade your account immediately.
                  </p>
                </div>
              </div>
              
              <div className={styles.stepCard}>
                <div className={styles.stepNum}>B</div>
                <div className={styles.stepDetails}>
                  <h4 className={styles.stepTitle}>Automatic Match (24–48 Hours)</h4>
                  <p className={styles.stepDesc}>
                    We sync Patreon registers daily. If your Patreon email matches your Pixie email ({user?.email}), you'll be upgraded automatically.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={styles.modalActionRow}>
              <a 
                href={getMailtoLink()}
                className={styles.secondaryEmailBtn}
              >
                <Mail size={18} /> Email for Instant Activation
              </a>
              <a 
                href="https://patreon.com/u71272467" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.primaryPatreonBtn}
              >
                Go back to Patreon <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
