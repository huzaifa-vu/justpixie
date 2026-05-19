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
    <div className={styles.container}>
      {/* Top Banner section */}
      <div className={styles.headerSection}>
        <div className={styles.sparkleIcon}>
          <Crown size={32} style={{ color: "var(--mint-green)" }} />
        </div>
        <h1 className={styles.title}>
          Unlock <span className={styles.gradientText}>Unlimited Magic</span>
        </h1>
        <p className={styles.subtitle}>
          Supercharge your workflow with heavy-duty AI engines, local high-density conversions, and unlimited prompts.
        </p>
      </div>

      {/* Main pricing structure */}
      <div className={styles.pricingWrapper}>
        {/* Tier 1: Free */}
        <div className={styles.pricingCard}>
          <div className={styles.cardHeader}>
            <span className={styles.tierName}>Guest Explorer</span>
            <div className={styles.priceRow}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>0</span>
              <span className={styles.period}>/no account</span>
            </div>
            <p className={styles.cardDesc}>Try out the tools without signing in.</p>
          </div>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Standard File Tools</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Local WASM processing</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>3 AI Prompts Daily</span>
            </div>
            <div className={styles.featureItemDisabled}>
              <span className={styles.dash}>—</span>
              <span>Unlimited AI Prompts</span>
            </div>
          </div>

          <button className={styles.planBtnOutlined} disabled>
            Free Tier
          </button>
        </div>

        {/* Tier 2: Hobbyist */}
        <div className={styles.pricingCard}>
          <div className={styles.cardHeader}>
            <span className={styles.tierName}>Hobbyist</span>
            <div className={styles.priceRow}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>0</span>
              <span className={styles.period}>/forever</span>
            </div>
            <p className={styles.cardDesc}>Perfect for exploring Pixie's magical file tools.</p>
          </div>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>All 50+ File Tools forever</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Local-first WASM processing</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>100 Free AI Prompts Daily</span>
            </div>
            <div className={styles.featureItemDisabled}>
              <span className={styles.dash}>—</span>
              <span>Unlimited AI Prompts</span>
            </div>
          </div>

          <button className={styles.planBtnOutlined} disabled>
            Current Plan
          </button>
        </div>

        {/* Tier 3: Pro */}
        <div className={`${styles.pricingCard} ${styles.pricingCardActive}`}>
          <div className={styles.badge}>Most Popular</div>
          <div className={styles.cardHeader}>
            <span className={styles.tierName}>Unlimited Magic</span>
            <div className={styles.priceRow}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>1</span>
              <span className={styles.period}>/month</span>
            </div>
            <p className={styles.cardDesc}>Support on Patreon. Cancel anytime.</p>
          </div>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Unlimited AI Prompts</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Intelligent File Routing Engine</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>Priority Conversion Queue</span>
            </div>
            <div className={styles.featureItem}>
              <Check className={styles.checkIcon} size={16} />
              <span>All 50+ File Tools forever</span>
            </div>
          </div>

          <button 
            className={styles.planBtnSolid} 
            onClick={handleUpgrade}
          >
            Upgrade via Patreon <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className={styles.faqWrapper}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqItems.map((item, idx) => (
            <div key={idx} className={styles.faqItem}>
              <button 
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
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
                    href={getMailtoLink()}
                    className={styles.primaryPatreonBtn}
                  >
                    <Mail size={18} /> Email for Instant Activation
                  </a>
                  <a 
                    href="https://patreon.com/u71272467" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.secondaryEmailBtn}
                  >
                    Go to Patreon to Subscribe <ExternalLink size={16} />
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
