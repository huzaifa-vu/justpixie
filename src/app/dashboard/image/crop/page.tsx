"use client";
import { useEffect, useState, useRef } from "react";
import { UploadCloud, Crop as CropIcon, Wand2, RefreshCw, Download, ArrowLeft } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
export default function ImageCropper() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const { settings } = useSettings();
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setCompletedCrop(null);
      setCrop(undefined);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const executeCrop = async () => {
    if (!imgElement || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;
    setIsProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2d context");

      // ReactCrop gives percentages if unit is '%', but we configure it to use 'px' by default usually.
      // But let's calculate real pixel coordinates from image source vs rendered size
      const scaleX = imgElement.naturalWidth / imgElement.width;
      const scaleY = imgElement.naturalHeight / imgElement.height;

      const pixelCrop = {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
      };

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        imgElement,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
        }
        setIsProcessing(false);
      }, "image/png");
    } catch {
      alert("Crop failed");
      setIsProcessing(false);
    }
  };
  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      const f = files[0];
      setSelectedFile(f);
      setOriginalUrl(URL.createObjectURL(f));
      setResultUrl(null);
    }
  }, "/dashboard/image/crop");

  useEffect(() => {
    if (resultUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `pixie-${Date.now()}.png`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);



  return (
    <ToolWrapper title="Image Cropper" description="Visually crop images down to specific pixel regions." icon={CropIcon}>

      <div className={styles.workspace}>
        <div className={styles.canvasArea}>
          {!originalUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Select an Image"
              subtitle="PNG, JPG, WebP"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              {!resultUrl ? (
                <div style={{ maxHeight: '60vh', overflow: 'hidden', border: '1px solid var(--border)' }}>
                   <ReactCrop 
                      crop={crop} 
                      onChange={(_, percentCrop) => setCrop(percentCrop)} 
                      onComplete={(c) => setCompletedCrop(c)}
                   >
                     <img 
                        src={originalUrl} 
                        onLoad={(e) => setImgElement(e.currentTarget)} 
                        style={{ maxHeight: '60vh', width: 'auto', display: 'block' }} 
                        alt="Crop target" 
                     />
                   </ReactCrop>
                </div>
              ) : (
                <div className={styles.resultDetails} style={{ textAlign: 'center' }}>
                   <div style={{ padding: '1rem', background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgGwEg9AMGBwsrBQD0cQNgYGPxg9L8fP44hOBygOQAGBgAIAgCGBgAGBgAIPgBFAgAAAABJRU5ErkJggg==")' }}>
                      <img src={resultUrl} style={{ maxWidth: '100%', maxHeight: '60vh' }} alt="Cropped result" />
                   </div>
                </div>
              )}
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Interactive Crop</h2>
          </div>
          <div className={styles.configBody}>
             {imgElement && (
                <div className={styles.infoBox}>
                   Original: {imgElement.naturalWidth} × {imgElement.naturalHeight}px
                </div>
             )}

             <button className={styles.uploadBtn} onClick={() => { setResultUrl(null); fileInputRef.current?.click(); }}>
               {originalUrl ? "Upload New Image" : "Upload Image"}
             </button>

             {!resultUrl ? (
                <button className={styles.actionBtn} onClick={executeCrop} disabled={!completedCrop?.width || isProcessing}>
                   {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Cropping...</> : <><CropIcon size={20} /> Crop Selection</>}
                </button>
             ) : (
                <>
                  <a href={resultUrl} download={`cropped-${selectedFile?.name}`} style={{ textDecoration: 'none' }}>
                     <button className={styles.actionBtnAlt} style={{ width: '100%' }}>
                        <Download size={20} /> Download
                     </button>
                  </a>
                  <button className={styles.uploadBtn} onClick={() => { setResultUrl(null); }} style={{ marginTop: '0.75rem' }}>
                     Adjust Crop
                  </button>
                </>
             )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


