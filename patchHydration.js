const fs = require('fs');
const path = require('path');

const tools = [
  {
    file: 'dev/lorem/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ params, autoExecute }) => {\n    if (params?.count) setParagraphs(Number(params.count));\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/dev/lorem");\n\n  useEffect(() => {\n    if (autoRun) {\n      generate();\n      setAutoRun(false);\n    }\n  }, [autoRun, paragraphs]);'
  },
  {
    file: 'dev/uuid/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ autoExecute }) => {\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/dev/uuid");\n\n  useEffect(() => {\n    if (autoRun) {\n      generateUuids();\n      setAutoRun(false);\n    }\n  }, [autoRun]);'
  },
  {
    file: 'pdf/text-watermark/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ files, params, autoExecute }) => {\n    if (files && files.length > 0) {\n      setFile(files[0]);\n      setOutputUrl(null);\n    }\n    if (params?.watermarkText) setWatermarkText(String(params.watermarkText));\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/pdf/text-watermark");\n\n  useEffect(() => {\n    if (autoRun && file && watermarkText && !isProcessing) {\n      handleProcess();\n      setAutoRun(false);\n    }\n  }, [autoRun, file, watermarkText, isProcessing]);'
  },
  {
    file: 'pdf/rotate/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ files, autoExecute }) => {\n    if (files && files.length > 0) {\n      handleFileChange({ target: { files: [files[0]] } } as any);\n    }\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/pdf/rotate");\n\n  useEffect(() => {\n    if (autoRun && pdfFile && !isProcessing) {\n      handleRotate();\n      setAutoRun(false);\n    }\n  }, [autoRun, pdfFile, isProcessing]);'
  },
  {
    file: 'pdf/page-numbers/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ files, autoExecute }) => {\n    if (files && files.length > 0) {\n      handleFileChange({ target: { files: [files[0]] } } as any);\n    }\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/pdf/page-numbers");\n\n  useEffect(() => {\n    if (autoRun && pdfFile && !isProcessing) {\n      handleProcess();\n      setAutoRun(false);\n    }\n  }, [autoRun, pdfFile, isProcessing]);'
  },
  {
    file: 'text/speech/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ params, autoExecute }) => {\n    if (params?.inputText) setText(String(params.inputText));\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/text/speech");\n\n  useEffect(() => {\n    if (autoRun && text.trim() && voices.length > 0) {\n      handlePlay();\n      setAutoRun(false);\n    }\n  }, [autoRun, text, voices]);'
  },
  {
    file: 'image/crop/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '',
    hydrationToken: '  useAiHydration(({ files }) => {\n    if (files && files.length > 0) {\n      const f = files[0];\n      setOriginalUrl(URL.createObjectURL(f));\n      setResultUrl(null);\n    }\n  }, "/dashboard/image/crop");\n'
  },
  {
    file: 'image/favicon/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ files, autoExecute }) => {\n    if (files && files.length > 0) {\n      const f = files[0];\n      setOriginalFile(f);\n      setOriginalUrl(URL.createObjectURL(f));\n      setResultUrl(null);\n    }\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/image/favicon");\n\n  useEffect(() => {\n    if (autoRun && originalFile && !isProcessing) {\n      execute();\n      setAutoRun(false);\n    }\n  }, [autoRun, originalFile, isProcessing]);'
  },
  {
    file: 'image/filters/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";',
    stateStr: '',
    hydrationToken: '  useAiHydration(({ files }) => {\n    if (files && files.length > 0) {\n      const f = files[0];\n      setOriginalUrl(URL.createObjectURL(f));\n      setResultUrl(null);\n    }\n  }, "/dashboard/image/filters");\n'
  },
  {
    file: 'image/rotate/page.tsx',
    import: 'import { useAiHydration } from "@/hooks/useAiHydration";\nimport { useEffect } from "react";',
    stateStr: '  const [autoRun, setAutoRun] = useState(false);',
    hydrationToken: '  useAiHydration(({ files, autoExecute }) => {\n    if (files && files.length > 0) {\n      const f = files[0];\n      setOriginalFile(f);\n      setOriginalUrl(URL.createObjectURL(f));\n      setResultUrl(null);\n    }\n    if (autoExecute) setAutoRun(true);\n  }, "/dashboard/image/rotate");\n\n  useEffect(() => {\n    if (autoRun && originalFile && !isProcessing) {\n      execute();\n      setAutoRun(false);\n    }\n  }, [autoRun, originalFile, isProcessing]);'
  }
];

const basePath = path.join(__dirname, 'src/app/dashboard');

tools.forEach(tool => {
  const fullPath = path.join(basePath, tool.file);
  if (!fs.existsSync(fullPath)) {
    console.error("Missing inside", fullPath);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip if already applied
  if (content.includes('useAiHydration')) return;

  // Insert imports after the first 'use client'; or at top
  const importBlock = tool.import;
  // If react import exists but misses useEffect, add it for safety (though my manual block usually overrides)
  if (!content.includes('import { useEffect }') && importBlock.includes('useEffect')) {
    content = content.replace(/(import.*react.*)/, 'import { useEffect, useState, useRef } from "react";');
  }
  
  content = content.replace(/(import .*;\n)+/, (match) => match + importBlock + '\n\n');
  
  // Insert state inside the component definition, usually right after const router = useRouter(); or the first useState
  const stateRegex = /(const \[.*set.*useState.*)/;
  if (tool.stateStr) {
    content = content.replace(stateRegex, tool.stateStr + '\n  $1');
  }

  // Insert hydration block right before return (
  content = content.replace(/(\s+return \()/, '\n' + tool.hydrationToken + '\n$1');

  fs.writeFileSync(fullPath, content);
  console.log("Patched", tool.file);
});
