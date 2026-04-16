const fs = require('fs');
const path = require('path');

const toolsDirs = ['image', 'pdf', 'video', 'text', 'dev'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already wrapped
  if (content.includes('ToolWrapper')) return;

  // Extract old header
  const headerSectionMatch = content.match(/<header[\s\S]*?<\/header>/);
  if (!headerSectionMatch) return;
  const oldHeader = headerSectionMatch[0];

  // Try to find icon name
  // It looks like <Wand2 size=... or <Crop size=...
  let iconName = 'Wand2';
  const iconMatch = oldHeader.match(/<([A-Z][A-Za-z0-9]+)\s+size=/);
  if (iconMatch) {
    if (iconMatch[1] !== 'ArrowLeft' && iconMatch[1] !== 'Link' && iconMatch[1] !== 'Image') {
      iconName = iconMatch[1];
    } else {
       // get second one if ArrowLeft
       const matches = [...oldHeader.matchAll(/<([A-Z][A-Za-z0-9]+)\s+size=/g)];
       for (const m of matches) {
           if (m[1] !== 'ArrowLeft' && m[1] !== 'Link') {
               iconName = m[1];
               break;
           }
       }
    }
  }

  // Find title
  let title = 'Tool';
  const titleMatch = oldHeader.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/);
  if (titleMatch) title = titleMatch[1].replace(/<[^>]*>/g, '').trim();

  // Find description
  let desc = '';
  // sometimes multiple <p>, take the last one or the one not empty
  const pMatches = [...oldHeader.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  if (pMatches.length > 0) {
    desc = pMatches[pMatches.length - 1][1].replace(/<[^>]*>/g, '').trim();
  }

  const wrapperProps = `title="${title}" description="${desc}" icon={${iconName}}`;

  // Ensure ToolWrapper is imported
  if (!content.includes('import ToolWrapper')) {
    // find last import via react or lucide
    content = content.replace(/(import.*lucide-react.*;)/, '$1\nimport ToolWrapper from "@/components/ToolWrapper";');
    if (!content.includes('ToolWrapper')) {
        content = content.replace(/(import .*;\n)/, '$1import ToolWrapper from "@/components/ToolWrapper";\n');
    }
  }

  // Find the container div and workspace
  // Often it's <div className={styles.container}>\s*<header>...</header>\s*(<div className={styles.workspace}>
  const replacement = `<ToolWrapper ${wrapperProps}>`;
  
  // We need to replace `<div className={styles.container}>` and `<header>...</header>` with `<ToolWrapper>`
  // and append `</ToolWrapper>` right before the final `</div>` of the component.
  
  content = content.replace(/<div className=\{styles\.container\}>[\s\S]*?<header[^>]*>[\s\S]*?<\/header>/, replacement);
  
  if (content.includes(replacement)) {
    // Replace the last </div> before the final export/return boundary, which is tricky.
    // Let's replace the VERY LAST </div>
    const lastDivIndex = content.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      content = content.substring(0, lastDivIndex) + '</ToolWrapper>' + content.substring(lastDivIndex + 6);
    }
    
    console.log("Wrapped", filePath, "| Title:", title, "| Icon:", iconName);
    fs.writeFileSync(filePath, content);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) traverse(full);
    else if (full.endsWith("page.tsx")) processFile(full);
  }
}

toolsDirs.forEach(dir => traverse(path.join(__dirname, 'src/app/dashboard', dir)));
