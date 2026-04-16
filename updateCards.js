const fs = require('fs');
const path = require('path');

const dirs = ['image', 'pdf', 'video', 'text', 'dev'];

dirs.forEach(dir => {
  const file = path.join(__dirname, 'src/app/dashboard', dir, 'page.tsx');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add ArrowRight import if missing
    if (!content.includes('ArrowRight')) {
      content = content.replace(/(import .* from "lucide-react";)/, (match) => {
        return match.replace('}', ', ArrowRight }');
      });
    }

    // Replace toolCard content
    const oldCard = `              <div className={styles.toolHeader}>
                <span className={styles.toolBadge}>{tool.type}</span>
                <tool.icon size={20} className={styles.toolIcon} style={{ opacity: 0.8 }} />
              </div>
              <h4 className={styles.toolName}>{tool.name}</h4>
              <p className={styles.toolDesc}>{tool.desc}</p>`;

    const newCard = `              <div className={styles.toolHeader}>
                <div className={styles.toolIconContainer}>
                  <tool.icon size={24} className={styles.toolIcon} />
                </div>
                <span className={styles.toolBadge}>{tool.type}</span>
              </div>
              <h4 className={styles.toolName}>{tool.name}</h4>
              <p className={styles.toolDesc}>{tool.desc}</p>
              <div className={styles.toolArrowBtn}>
                <ArrowRight size={18} />
              </div>`;

    content = content.replace(oldCard, newCard);
    
    // Also remove { opacity: 0.8 } from old ones if they had variations
    content = content.replace(/<tool\.icon size=\{20\} className=\{styles\.toolIcon\}[^>]*\/>/g, '<tool.icon size={24} className={styles.toolIcon} />');
    
    fs.writeFileSync(file, content);
  }
});
