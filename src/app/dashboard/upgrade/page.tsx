"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, HelpCircle, ArrowRight, ChevronDown, X as XIcon, Compass, User, Crown, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export default function UpgradePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isLifetime, setIsLifetime] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      a: "Yes! All image, PDF, and video editing actions are executed directly inside your local web browser using client-side WASM sandboxing. None of your media files are ever uploaded, stored, or processed on our servers."
    },
    {
      q: "How does Patreon billing work?",
      a: "Patreon subscriptions are priced at just $1/month, billed monthly. You can cancel at any time directly through your Patreon account with a single click."
    },
    {
      q: "How fast is manual activation?",
      a: "If you use the 'Email for Instant Activation' link inside the modal, I will manually upgrade your account immediately (typically within 1-2 hours). Auto-match activation matches registers daily and takes 24-48 hours."
    }
  ];

  return (
    <div className={styles.dashboardPricing}>
      <div className={styles.headerArea}>
        <div className={styles.badge}><Sparkles size={16} /> Support Indie Devs</div>
        <h1 className={styles.title}>Unlock <br/><span className={styles.titleHighlight}>Unlimited Magic</span></h1>
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

      {/* Interactive FAQ Accordion Section */}
      <div className={styles.faq}>
        <h2><HelpCircle size={24} style={{ color: 'var(--mint-green)', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqItems.map((item, idx) => (
            <div key={idx} className={`${styles.faqItem} ${openFaq === idx ? styles.faqItemOpen : ''}`}>
              <button 
                className={styles.faqHeader}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={20} className={`${styles.faqChevron} ${openFaq === idx ? styles.faqChevronOpen : ''}`} />
              </button>
              <div className={styles.faqAnswer}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patreon Activation Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalOverlay}
              onClick={() => setShowModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className={styles.modalCloseBtn}
                  onClick={() => setShowModal(false)}
                  aria-label="Close modal"
                >
                  <XIcon size={20} />
                </button>
                
                <h2 className={styles.modalTitle}>
                  <Crown size={26} style={{ color: "var(--mint-green)" }} /> Upgrade to Unlimited Magic
                </h2>
                <p className={styles.modalSub}>
                  Follow these two simple steps to subscribe and activate your professional account:
                </p>
                
                <div className={styles.stepsContainer}>
                  <div className={styles.stepCard}>
                    <div className={styles.stepNum}>1</div>
                    <div className={styles.stepDetails}>
                      <h4 className={styles.stepTitle}>Subscribe on Patreon ($1/month)</h4>
                      <p className={styles.stepDesc}>
                        Click the primary button below to go to Patreon. Choose the $1/month tier and subscribe.
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.stepCard}>
                    <div className={styles.stepNum}>2</div>
                    <div className={styles.stepDetails}>
                      <h4 className={styles.stepTitle}>Activate Your Account</h4>
                      <p className={styles.stepDesc}>
                        Once subscribed, click 'Email for Instant Activation' to notify me for instant upgrade, or wait for automatic sync.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={styles.modalActionRow}>
                  <a 
                    href="https://patreon.com/u71272467" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.primaryPatreonBtn}
                  >
                    Go to Patreon to Subscribe <ExternalLink size={16} />
                  </a>
                  <a 
                    href={getMailtoLink()}
                    className={styles.secondaryEmailBtn}
                  >
                    <Mail size={18} /> Email for Instant Activation
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
