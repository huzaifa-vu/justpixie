const fs = require('fs');
const path = require('path');

const applyDropdown = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('<select')) return;

  // Add import
  if (!content.includes('import Dropdown')) {
    content = content.replace(/(import.*lucide-react.*;)/, '$1\nimport Dropdown from "@/components/Dropdown";');
  }

  // Use simple regex trick: because the options are mixed and complex, parsing `<select ...> <option>...</option> ... </select>` is very hard in regex.
  // We'll extract the <select> tag to get its state variables, then find all <option value="X">Label</option>, then build the Dropdown props.
  
  const selectBlocks = [...content.matchAll(/<select[\s\S]*?<\/select>/g)];
  for (const block of selectBlocks) {
    const rawSelect = block[0];
    
    // Find value and onChange
    const valMatch = rawSelect.match(/value=\{([^\}]+)\}/);
    const onChangeMatch = rawSelect.match(/onChange=\{([^\}]+)\}/);
    
    if (valMatch && onChangeMatch) {
      const valueText = valMatch[1];
      let onChangeText = onChangeMatch[1];
      
      // Usually onChange={(e) => setSpeed(e.target.value)}
      // We want to pass the direct value back: onChange={(val) => setSpeed(val)}
      if (onChangeText.includes('e.target.value')) {
        onChangeText = onChangeText.replace(/\([^)]+\)\s*=>/, '(val) =>');
        onChangeText = onChangeText.replace(/e\.target\.value( as any)?/, 'val');
      }

      // Collect options
      const options = [];
      const optionMatches = [...rawSelect.matchAll(/<option[^>]*value=["'{](.*?)["'}][^>]*>([\s\S]*?)<\/option>/g)];
      for (const m of optionMatches) {
        options.push(`{ label: "${m[2].trim()}", value: "${m[1].trim()}" }`);
      }

      if (options.length > 0) {
        const replaceString = `<Dropdown options={[${options.join(', ')}]} value={${valueText}} onChange={${onChangeText}} />`;
        content = content.replace(rawSelect, replaceString);
        console.log("Replaced select in", filePath);
      }
    }
  }

  fs.writeFileSync(filePath, content);
};

const dirs = ['video', 'pdf', 'image', 'text', 'dev', 'settings'];
dirs.forEach(d => {
  const dirPath = path.join(__dirname, 'src/app/dashboard', d);
  if (fs.existsSync(dirPath)) {
    const walk = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.tsx')) applyDropdown(full);
      });
    };
    walk(dirPath);
  }
});
