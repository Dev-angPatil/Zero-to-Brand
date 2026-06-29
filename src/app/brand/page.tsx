"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
}

interface AudioTheme {
  tempo: number;
  scale: "major" | "minor" | "pentatonic";
  instrument: "acoustic" | "warm-synth" | "bell";
  mood: "organic" | "modern" | "luxury";
}

interface BrandVariables {
  brandName: string;
  brandDescription: string;
  tagline: string;
  colors: BrandColors;
  logoSvg: string;
  logoImage?: string;
  bannerImage?: string;
  adBannerCopy: string;
  audioTheme: AudioTheme;
}

interface Draft {
  id: string;
  rawImage: string;
  brandVariables: BrandVariables;
}

interface Product {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  tagline: string;
  rawImage: string;
  campaignImage?: string;
  materials: string[];
  textures: string[];
  craftsmanship: string;
  aspectRatio?: "16:9" | "1:1" | "9:16" | "4:3";
  stylePreset?: "solarpunk" | "cyberpunk" | "minimalist" | "vintage" | "cozy";
  bannerHistory?: string[];
  sceneDescription?: string;
  adCopyTone?: string;
  keywords?: string[];
}

function BrandContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>([10, 10, 10, 10, 10]);

  // Product addition state
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [uploadProductProgress, setUploadProductProgress] = useState("");

  // Product questionnaire modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProductImage, setPendingProductImage] = useState<string | null>(null);
  const [productScene, setProductScene] = useState("");
  const [productTone, setProductTone] = useState("Earthy & Organic");
  const [productKeywords, setProductKeywords] = useState("");

  // Product Customization Console drawer state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStylePreset, setEditStylePreset] = useState<"solarpunk" | "cyberpunk" | "minimalist" | "vintage" | "cozy">("solarpunk");
  const [editAspectRatio, setEditAspectRatio] = useState<"16:9" | "1:1" | "9:16" | "4:3">("16:9");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isRegeneratingProduct, setIsRegeneratingProduct] = useState(false);
  const [productProgressText, setProductProgressText] = useState("");
  const [activeTab, setActiveTab] = useState<"poster" | "studio" | "raw">("poster");

  // Audio & File refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStateRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft & products data
  useEffect(() => {
    if (!draftId) {
      router.push("/");
      return;
    }

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/brands?id=${draftId}`);
        if (res.ok) {
          const data = (await res.json()) as Draft;
          if (!data.brandVariables) {
            router.push(`/copilot?draftId=${draftId}`);
            return;
          }
          setDraft(data);

          // Fetch products catalog
          const prodRes = await fetch(`/api/products?brandId=${draftId}`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProducts(prodData);
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();

    // Clean up audio on unmount
    return () => {
      stopJingle();
    };
  }, [draftId, router]);

  // Visualizer animation frame loop
  useEffect(() => {
    let animId: number;
    const updateVisuals = () => {
      if (playStateRef.current && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const step = Math.floor(dataArray.length / 5);
        const newBars = [0, 0, 0, 0, 0].map((_, i) => {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j];
          }
          const avg = sum / step;
          return Math.max(10, Math.min(80, (avg / 255) * 80 + 10));
        });
        setAudioBars(newBars);
      } else {
        setAudioBars([10, 10, 10, 10, 10]);
      }
      animId = requestAnimationFrame(updateVisuals);
    };

    animId = requestAnimationFrame(updateVisuals);
    return () => cancelAnimationFrame(animId);
  }, []);

  const downloadLogo = () => {
    if (!draft) return;
    const logoImg = draft.brandVariables.logoImage;
    if (logoImg) {
      const link = document.createElement("a");
      link.href = logoImg;
      link.download = `${draft.brandVariables.brandName.toLowerCase().replace(/\s+/g, "_")}_logo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const svgContent = draft.brandVariables.logoSvg;
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draft.brandVariables.brandName.toLowerCase().replace(/\s+/g, "_")}_logo.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadBanner = () => {
    if (!draft || !draft.brandVariables.bannerImage) return;
    const link = document.createElement("a");
    link.href = draft.brandVariables.bannerImage;
    link.download = `${draft.brandVariables.brandName.toLowerCase().replace(/\s+/g, "_")}_banner.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAdText = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.brandVariables.adBannerCopy);
    alert("Ad Copy copied to clipboard!");
  };

  // --- Web Audio Synth logic ---
  const startJingle = () => {
    if (!draft) return;
    const theme = draft.brandVariables.audioTheme;

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 32;
    analyserRef.current = analyser;

    analyser.connect(ctx.destination);
    playStateRef.current = true;
    setIsPlaying(true);

    const tempo = theme.tempo || 90;
    const intervalMs = (60 / tempo) * 1000 * 0.5;

    const scales = {
      pentatonic: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
      major: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25],
      minor: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0],
    };

    const notes = scales[theme.scale] || scales.pentatonic;

    const chordProgressions = {
      pentatonic: [
        [130.81, 164.81, 196.0],
        [146.83, 174.61, 220.0],
        [164.81, 196.0, 246.94],
        [130.81, 164.81, 220.0],
      ],
      major: [
        [130.81, 164.81, 196.0],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
        [110.0, 130.81, 164.81],
      ],
      minor: [
        [110.0, 130.81, 164.81],
        [146.83, 174.61, 220.0],
        [130.81, 164.81, 196.0],
        [164.81, 207.65, 246.94],
      ],
    };

    const chords = chordProgressions[theme.scale] || chordProgressions.pentatonic;
    let stepCount = 0;

    const playSynth = (freq: number, start: number, duration: number, isChord = false) => {
      if (!audioCtxRef.current) return;
      const t = start;

      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(analyser);

      osc.frequency.setValueAtTime(freq, t);

      if (theme.instrument === "bell") {
        osc.type = "sine";
        const mod = audioCtxRef.current.createOscillator();
        const modGain = audioCtxRef.current.createGain();
        mod.frequency.setValueAtTime(freq * 1.414, t);
        modGain.gain.setValueAtTime(freq * 0.8, t);
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start(t);
        mod.stop(t + duration);

        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.08 : 0.12, t + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else if (theme.instrument === "warm-synth") {
        osc.type = "triangle";
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
        filter.frequency.exponentialRampToValueAtTime(300, t + duration);
        osc.disconnect(gainNode);
        osc.connect(filter);
        filter.connect(gainNode);

        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.06 : 0.1, t + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else {
        osc.type = "sine";
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.07 : 0.15, t + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      }

      osc.start(t);
      osc.stop(t + duration);
    };

    const scheduleNextNotes = () => {
      const now = ctx.currentTime;
      const schedTime = now + 0.1;

      const chordIndex = Math.floor(stepCount / 8) % chords.length;
      const currentChord = chords[chordIndex];

      if (stepCount % 8 === 0) {
        currentChord.forEach((freq) => {
          playSynth(freq, schedTime, 1.8, true);
        });
      }

      if (stepCount % 2 === 0 || Math.random() > 0.4) {
        const noteIndex = (stepCount * 2 + Math.floor(Math.random() * 2)) % notes.length;
        playSynth(notes[noteIndex] * 2, schedTime, 0.4, false);
      }

      stepCount++;
    };

    scheduleNextNotes();
    loopIntervalRef.current = setInterval(scheduleNextNotes, intervalMs);
  };

  function stopJingle() {
    playStateRef.current = false;
    setIsPlaying(false);

    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }

  const handlePlayToggle = () => {
    if (isPlaying) stopJingle();
    else startJingle();
  };

  // --- Product Management Logic ---
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processProductFile(file);
  };

  const processProductFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        if (!base64Image) throw new Error("Failed to read file");
        setPendingProductImage(base64Image);
        setProductScene("");
        setProductTone("Earthy & Organic");
        setProductKeywords("");
        setIsProductModalOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Product upload error:", error);
    }
  };

  const submitProductCampaign = async () => {
    if (!draft || !pendingProductImage) return;
    setIsProductModalOpen(false);
    setIsUploadingProduct(true);
    setUploadProductProgress("Ingesting craft materials...");

    try {
      setUploadProductProgress("Gemini copywriting & modular agents running...");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: draft.id,
          rawImage: pendingProductImage,
          sceneDescription: productScene,
          adCopyTone: productTone,
          keywords: productKeywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const prodRes = await fetch(`/api/products?brandId=${draft.id}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
      } else {
        throw new Error("Failed to generate product campaign");
      }
    } catch (error) {
      console.error("Product upload error:", error);
      alert("Error adding product campaign. Please try again.");
    } finally {
      setIsUploadingProduct(false);
      setPendingProductImage(null);
    }
  };

  const deleteProduct = async (e: React.MouseEvent | null, productId: string) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this product campaign?")) return;
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleOpenDrawer = (prod: Product) => {
    setSelectedProduct(prod);
    setEditName(prod.name);
    setEditTagline(prod.tagline);
    setEditDescription(prod.description);
    setEditStylePreset(prod.stylePreset || "solarpunk");
    setEditAspectRatio(prod.aspectRatio || "16:9");
    setFeedbackText("");
    setIsDrawerOpen(true);
  };

  const handleSaveTextEdits = async () => {
    if (!selectedProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          tagline: editTagline,
          description: editDescription,
          stylePreset: editStylePreset,
          aspectRatio: editAspectRatio,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setIsDrawerOpen(false);
        setSelectedProduct(null);
      } else {
        alert("Failed to save product details.");
      }
    } catch (err) {
      console.error("Error saving product details:", err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleRegenerateBanner = async () => {
    if (!selectedProduct) return;
    setIsRegeneratingProduct(true);
    setProductProgressText("Gemini is engineering prompt & Imagen is painting...");
    try {
      const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          tagline: editTagline,
          description: editDescription,
          feedback: feedbackText,
          stylePreset: editStylePreset,
          aspectRatio: editAspectRatio,
          regenerate: true,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedProduct(updated);
        setEditName(updated.name);
        setEditTagline(updated.tagline);
        setEditDescription(updated.description);
        setEditStylePreset(updated.stylePreset || "solarpunk");
        setEditAspectRatio(updated.aspectRatio || "16:9");
        setFeedbackText("");
      } else {
        alert("Failed to regenerate campaign banner.");
      }
    } catch (err) {
      console.error("Error regenerating banner:", err);
    } finally {
      setIsRegeneratingProduct(false);
    }
  };

  const handleSelectHistoryBanner = async (img: string) => {
    if (!selectedProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeBanner: img,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedProduct(updated);
      } else {
        alert("Failed to update active banner.");
      }
    } catch (err) {
      console.error("Error updating active banner:", err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const downloadPosterImage = (product: Product, brandVars: BrandVariables) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = brandVars.colors.background || "#f7faf2";
    ctx.fillRect(0, 0, 800, 1200);

    ctx.strokeStyle = brandVars.colors.primary || "#264e2b";
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, 740, 1140);
    
    ctx.strokeStyle = brandVars.colors.secondary || "#fcd03d";
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 710, 1110);

    ctx.fillStyle = brandVars.colors.primary || "#264e2b";
    ctx.textAlign = "center";
    ctx.font = "bold 32px Georgia, serif";
    ctx.fillText(brandVars.brandName.toUpperCase(), 400, 100);

    ctx.font = "italic 18px Arial, sans-serif";
    ctx.fillStyle = brandVars.colors.primary || "#264e2b";
    ctx.fillText(`“ ${brandVars.tagline} ”`, 400, 130);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 80, 180, 640, 500);

      ctx.fillStyle = brandVars.colors.secondary || "#fcd03d";
      ctx.beginPath();
      ctx.arc(400, 180, 40, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = brandVars.colors.primary || "#264e2b";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText("★", 400, 188);

      ctx.fillStyle = brandVars.colors.primary || "#264e2b";
      ctx.font = "bold 44px Georgia, serif";
      ctx.fillText(product.name, 400, 750);

      ctx.font = "italic 22px Arial, sans-serif";
      ctx.fillStyle = brandVars.colors.secondary || "#fcd03d";
      ctx.fillText(product.tagline, 400, 790);

      ctx.font = "18px Arial, sans-serif";
      ctx.fillStyle = "#333333";
      const descWords = product.description.split(" ");
      let line = "";
      let y = 840;
      for (let n = 0; n < descWords.length; n++) {
        const testLine = line + descWords[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > 600 && n > 0) {
          ctx.fillText(line, 400, y);
          line = descWords[n] + " ";
          y += 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 400, y);

      const tags = product.keywords || [];
      if (tags.length > 0) {
        ctx.font = "bold 14px Arial, sans-serif";
        ctx.fillStyle = brandVars.colors.primary || "#264e2b";
        ctx.fillText(tags.map((t) => `#${t}`).join("  •  "), 400, 1080);
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${product.name.toLowerCase().replace(/\s+/g, "_")}_poster.png`;
      link.href = dataUrl;
      link.click();
    };
    img.src = product.campaignImage || product.rawImage;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropProduct = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processProductFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Assembling Brand Assets...</p>
      </div>
    );
  }

  const brandVars = draft?.brandVariables;
  if (!brandVars) return null;

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-12 pb-32">
      <div className="solar-flare"></div>

      {/* Header with Visual Poster */}
      <div className="text-center relative z-10 mt-4">
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-4xl h-[300px] md:h-[350px] rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(62,102,65,0.06)] relative border border-outline-variant/30">
            <img
              alt="Brand Banner Visual"
              className="w-full h-full object-cover object-[center_60%] saturate-[0.85]"
              src={brandVars.bannerImage || draft?.rawImage}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-black/10"></div>
          </div>
        </div>
        <h1 className="font-headline text-3xl md:text-5xl text-on-background mb-2 mt-4 font-bold">
          {brandVars.brandName}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto px-4 italic">
          &ldquo;{brandVars.tagline}&rdquo;
        </p>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {/* Card A: Storefront Visual */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300 shadow-sm border border-outline-variant/20 bg-white/40">
          <div className="h-44 relative overflow-hidden bg-surface-container flex items-center justify-center border-b border-outline-variant/20">
            <img
              alt="E-Commerce Mockup"
              className="w-full h-full object-cover mix-blend-multiply"
              src={brandVars.bannerImage || draft?.rawImage}
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 text-white rounded text-[10px] font-mono">
              Live Mock
            </div>
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="font-headline text-xl text-on-background mb-1">
              Storefront Visual
            </h3>
            <p className="text-sm text-on-surface-variant mb-5 flex-grow">
              Mockup of your craft displayed in a studio settings.
            </p>
            <button
              onClick={() => alert("Visual asset copied to clipboard!")}
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-4 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy Visual Link
            </button>
          </div>
        </div>

        {/* Card B: Brand Mark */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300 shadow-sm border border-outline-variant/20 bg-white/40">
          <div
            className="h-44 flex items-center justify-center bg-surface-container border-b border-outline-variant/20 p-6 overflow-hidden"
            style={{ color: brandVars.colors.primary }}
          >
            {brandVars.logoImage ? (
              <img
                src={brandVars.logoImage}
                alt="Brand Logo Mark"
                className="w-24 h-24 rounded-full object-cover shadow-sm border border-outline-variant/50 bg-surface"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border border-outline-variant/50 flex items-center justify-center bg-surface shadow-sm p-4"
                dangerouslySetInnerHTML={{ __html: brandVars.logoSvg }}
              />
            )}
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="font-headline text-xl text-on-background mb-1">
              Brand Mark
            </h3>
            <p className="text-sm text-on-surface-variant mb-5 flex-grow">
              Custom brand logo generated by Gemini. Ready for print.
            </p>
            <button
              onClick={downloadLogo}
              className="w-full flex items-center justify-center gap-1.5 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-4 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {brandVars.logoImage ? "Download Logo" : "SVG Vector"}
            </button>
          </div>
        </div>

        {/* Card C: Social Campaign Banner */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300 shadow-sm border border-outline-variant/20 bg-white/40">
          <div className="h-44 relative overflow-hidden border-b border-outline-variant/20 flex items-center justify-center">
            {brandVars.bannerImage ? (
              <>
                <img
                  src={brandVars.bannerImage}
                  alt="Social Campaign Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 flex flex-col justify-center items-center text-center p-4">
                  <p className="font-headline text-[13px] md:text-sm tracking-tight leading-snug text-white font-bold mb-1">
                    &ldquo;{brandVars.adBannerCopy}&rdquo;
                  </p>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/70">
                    Imagen 3 Banner
                  </span>
                </div>
              </>
            ) : (
              <div
                className="w-full h-full p-5 flex flex-col justify-center items-center text-center"
                style={{
                  backgroundColor: `${brandVars.colors.secondary}15`,
                  color: brandVars.colors.primary,
                }}
              >
                <p className="font-headline text-xl tracking-tight leading-snug">
                  &ldquo;{brandVars.adBannerCopy}&rdquo;
                </p>
                <span className="text-[10px] font-mono uppercase tracking-widest mt-3 opacity-70">
                  Generated Tagline
                </span>
              </div>
            )}
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="font-headline text-xl text-on-background mb-1">
              Social Banner
            </h3>
            <p className="text-sm text-on-surface-variant mb-5 flex-grow">
              Generated campaign visual banner featuring your product and copy.
            </p>
            <div className="flex gap-2">
              <button
                onClick={copyAdText}
                className="flex-1 flex items-center justify-center gap-1.5 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-1 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">assignment</span>
                Copy Copy
              </button>
              {brandVars.bannerImage && (
                <button
                  onClick={downloadBanner}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-1 rounded-full transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card D: Sonic Identity (Procedural Synthesizer) */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300 shadow-sm border border-outline-variant/20 bg-white/40">
          <div className="h-44 bg-surface-container flex flex-col items-center justify-center gap-4 border-b border-outline-variant/20 px-6">
            <div className="flex items-end gap-1.5 h-16">
              {audioBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-primary transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <button
              onClick={handlePlayToggle}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="font-headline text-xl text-on-background mb-1">
              Sonic Identity
            </h3>
            <p className="text-sm text-on-surface-variant mb-5 flex-grow uppercase font-mono text-[11px] leading-relaxed">
              Theme: {brandVars.audioTheme.mood} &bull; {brandVars.audioTheme.instrument} pluck &bull; {brandVars.audioTheme.tempo} BPM &bull; {brandVars.audioTheme.scale} scale
            </p>
            <button
              onClick={handlePlayToggle}
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-4 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPlaying ? "volume_off" : "volume_up"}
              </span>
              {isPlaying ? "Stop Jingle" : "Listen Live"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Products Catalog and Upload Zone */}
      <div className="flex flex-col lg:flex-row gap-8 relative z-10 border-t border-outline-variant/20 pt-8 mt-4">
        {/* Left Side: Product Campaigns Catalog list */}
        <section className="lg:w-[65%] flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
            <h2 className="font-headline text-2xl text-primary flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-secondary">inventory_2</span>
              Product Campaigns Catalog
            </h2>
            <span className="text-xs font-mono text-outline">{products.length} Products</span>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low rounded-[24px] border border-outline-variant/30 p-8 text-on-surface-variant flex flex-col items-center gap-2 bg-white/20">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">grid_view</span>
              <p className="font-label text-label-md font-semibold">No product campaigns launched yet</p>
              <p className="text-xs text-outline max-w-sm">
                Use the dropzone on the right to upload new crafts and let Gemini generate campaign banners and assets automatically!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleOpenDrawer(prod)}
                  className="glass-card bg-white/40 border border-outline-variant/30 rounded-[24px] overflow-hidden flex flex-col transform hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative group cursor-pointer"
                >
                  <div className="h-44 relative overflow-hidden bg-surface-container flex items-center justify-center border-b border-outline-variant/25">
                    <img src={prod.campaignImage || prod.rawImage} alt={prod.name} className="w-full h-full object-cover saturate-[0.9] group-hover:scale-102 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/45 text-white rounded text-[8px] font-mono uppercase tracking-wider shadow-sm">
                      Live Catalog
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col gap-2">
                    <h3 className="font-headline text-lg font-bold text-on-surface leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] font-mono text-secondary font-bold uppercase tracking-wider italic">
                      &ldquo;{prod.tagline}&rdquo;
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed flex-grow">
                      {prod.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {prod.materials.slice(0, 3).map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[9px] font-semibold border border-outline-variant/20">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteProduct(e, prod.id)}
                    className="absolute right-3 top-3 bg-black/50 text-white hover:text-error opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-full backdrop-blur-sm"
                    title="Delete Product"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Product creation dropzone */}
        <section className="lg:w-[35%] flex flex-col gap-6">
          <div className="border-b border-outline-variant/30 pb-4">
            <h2 className="font-headline text-2xl text-primary flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-secondary">add_circle</span>
              Add Product
            </h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDropProduct}
            onClick={!isUploadingProduct ? triggerFileInput : undefined}
            className={`w-full aspect-[4/3] rounded-[24px] dashed-terracotta bg-white/40 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group overflow-hidden border border-outline-variant/30 hover:scale-[1.01] hover:shadow-sm ${
              isUploadingProduct ? "cursor-wait bg-surface-container-high" : "cursor-pointer hover:bg-white/80"
            }`}
          >
            {isUploadingProduct ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in text-center p-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-secondary animate-spin flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-primary text-2xl">spa</span>
                </div>
                <h3 className="font-headline text-lg text-primary animate-pulse">{uploadProductProgress}</h3>
                <p className="text-xs text-on-surface-variant max-w-[200px]">
                  Gemini is analyzing details and Imagen is painting a custom campaign banner.
                </p>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4 soft-shadow organic-border group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[36px] text-secondary">add_a_photo</span>
                </div>
                <h3 className="font-headline text-lg text-on-surface mb-1">
                  Upload Product Craft Photo
                </h3>
                <p className="text-xs text-on-surface-variant max-w-xs px-2 leading-relaxed">
                  Drop a craft photo. We will generate descriptions, taglines, and a dedicated showcase banner automatically using the <strong>{brandVars.brandName}</strong> identity system.
                </p>
                <button
                  type="button"
                  className="mt-5 px-6 py-2 bg-primary text-on-primary font-label text-xs rounded-full shadow-sm hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  Browse Photo
                </button>
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProductFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploadingProduct}
            />
          </div>

          <div className="bg-surface-container-low p-5 rounded-[24px] border border-outline-variant/30 flex flex-col gap-2 bg-white/10">
            <h4 className="font-headline text-md text-primary font-bold">Campaign Integration</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Every product added represents a new campaign slot. Gemini automatically incorporates your brand&apos;s philosophy and aesthetic dials into each listing. Banners are rendered using Imagen 3 in a setting tailored to your vibe.
            </p>
          </div>
        </section>
      </div>

      {/* Deploy Actions */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30 z-40 md:static md:bg-transparent md:border-none md:p-0 flex justify-center pb-24 md:pb-12 mt-12">
        <button
          onClick={() => router.push(`/store/${draftId}`)}
          className="bg-primary text-on-primary font-label text-label-md py-4 px-8 rounded-[16px] shadow-[0_8px_24px_rgba(62,102,65,0.2)] hover:shadow-[0_12px_32px_rgba(62,102,65,0.3)] hover:-translate-y-0.5 transition-all duration-300 w-full md:w-auto text-lg flex items-center justify-center gap-2 cursor-pointer font-bold"
        >
          LAUNCH STOREFRONT LIVE
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>

      {/* Product Questionnaire Modal */}
      {isProductModalOpen && pendingProductImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto text-on-surface">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">temp_preferences_custom</span>
                Campaign Setup Questionnaire
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img src={pendingProductImage} alt="Pending product" className="max-h-40 object-contain rounded-lg border border-outline-variant/35 mb-2" />
              <p className="text-xs text-on-surface-variant">We detected a craft. Tell us a bit more to direct Gemini and Imagen:</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-headline text-sm font-semibold text-primary" htmlFor="productScene">Target Campaign Scene setting</label>
                <input
                  id="productScene"
                  type="text"
                  placeholder="e.g. Set on a wooden table in a sunlit garden, or dark studio lighting"
                  value={productScene}
                  onChange={(e) => setProductScene(e.target.value)}
                  className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-headline text-sm font-semibold text-primary" htmlFor="productTone">Slogan Copywriting Tone</label>
                <select
                  id="productTone"
                  value={productTone}
                  onChange={(e) => setProductTone(e.target.value)}
                  className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none cursor-pointer"
                >
                  <option value="Earthy & Organic">Earthy & Organic</option>
                  <option value="Ultra Minimalist & Clean">Ultra Minimalist & Clean</option>
                  <option value="High Luxury & Polished">High Luxury & Polished</option>
                  <option value="Cyberpunk & Neon-Lit">Cyberpunk & Neon-Lit</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-headline text-sm font-semibold text-primary" htmlFor="productKeywords">SEO Keywords (comma separated)</label>
                <input
                  id="productKeywords"
                  type="text"
                  placeholder="e.g. handmade, clay, terracotta, solar"
                  value={productKeywords}
                  onChange={(e) => setProductKeywords(e.target.value)}
                  className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                />
              </div>
            </div>

            <button
              onClick={submitProductCampaign}
              className="w-full py-3.5 bg-primary hover:opacity-95 text-on-primary font-label text-label-md rounded-xl transition-all shadow-sm font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              Generate Campaign Assets
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Customization Console Drawer */}
      {isDrawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-surface-container-lowest border-l border-outline-variant/30 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in text-on-surface">
            {isRegeneratingProduct ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-secondary animate-spin flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-primary text-2xl">spa</span>
                </div>
                <h3 className="font-headline text-xl text-primary animate-pulse">{productProgressText}</h3>
                <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Rewriting the Imagen generation prompt using Gemini 2.5 Flash to incorporate your styling notes and rendering the new advertisement banner.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-6">
                  <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">edit_note</span>
                    Campaign Console
                  </h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1 rounded-full hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="flex gap-2 mb-4 border-b border-outline-variant/20 pb-2">
                  {(["poster", "studio", "raw"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-bold font-label rounded-lg transition-colors cursor-pointer ${
                        activeTab === tab
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {tab === "poster" && "Marketing Poster"}
                      {tab === "studio" && "Studio Image"}
                      {tab === "raw" && "Original Craft"}
                    </button>
                  ))}
                </div>

                {activeTab === "poster" && (
                  <div className="flex flex-col gap-4 animate-fade-in mb-6">
                    <div 
                      className="w-full rounded-[24px] border p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden"
                      style={{ 
                        backgroundColor: brandVars.colors.background,
                        borderColor: brandVars.colors.primary,
                        borderWidth: "12px"
                      }}
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 pointer-events-none"></div>
                      
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-outline">
                        {brandVars.brandName}
                      </span>
                      <h4 className="font-headline text-lg font-bold text-on-surface leading-none mt-1">
                        {editName}
                      </h4>
                      <p className="text-[11px] font-mono text-secondary font-bold uppercase tracking-wider italic mt-0.5">
                        &ldquo;{editTagline}&rdquo;
                      </p>

                      <div className="w-full aspect-video rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-high my-4">
                        <img src={selectedProduct.campaignImage || selectedProduct.rawImage} alt="Poster Studio" className="w-full h-full object-cover" />
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                        {editDescription}
                      </p>
                    </div>

                    <button
                      onClick={() => downloadPosterImage(selectedProduct, brandVars)}
                      className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary py-3 rounded-xl hover:opacity-90 font-label text-xs shadow-sm transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Download Campaigns Poster
                    </button>
                  </div>
                )}

                {activeTab === "studio" && (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 mb-6 relative group animate-fade-in">
                    <img src={selectedProduct.campaignImage || selectedProduct.rawImage} alt="Campaign Visual" className="w-full h-full object-cover" />
                    <a
                      href={selectedProduct.campaignImage || selectedProduct.rawImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 bottom-3 bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded-full text-xs font-label flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      View Original
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {activeTab === "raw" && (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 mb-6 relative animate-fade-in">
                    <img src={selectedProduct.rawImage} alt="Original Craft input" className="w-full h-full object-cover filter saturate-[0.8]" />
                  </div>
                )}

                {/* Fields for custom edits */}
                <div className="flex flex-col gap-4 border-t border-outline-variant/20 pt-6 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-headline text-xs font-semibold text-primary" htmlFor="editName">Product Name</label>
                    <input
                      id="editName"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-headline text-xs font-semibold text-primary" htmlFor="editTagline">Tagline / Hook Copy</label>
                    <input
                      id="editTagline"
                      type="text"
                      value={editTagline}
                      onChange={(e) => setEditTagline(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-headline text-xs font-semibold text-primary" htmlFor="editDescription">Description</label>
                    <textarea
                      id="editDescription"
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-headline text-xs font-semibold text-primary" htmlFor="editStylePreset">Studio Style Guide</label>
                      <select
                        id="editStylePreset"
                        value={editStylePreset}
                        onChange={(e) => setEditStylePreset(e.target.value as any)}
                        className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-xs rounded-xl p-3 outline-none cursor-pointer"
                      >
                        <option value="solarpunk">Solarpunk Vibe</option>
                        <option value="cyberpunk">Cyberpunk Vibe</option>
                        <option value="minimalist">Minimalist Vibe</option>
                        <option value="vintage">Vintage Vibe</option>
                        <option value="cozy">Cozy Vibe</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-headline text-xs font-semibold text-primary" htmlFor="editAspectRatio">Aspect Ratio</label>
                      <select
                        id="editAspectRatio"
                        value={editAspectRatio}
                        onChange={(e) => setEditAspectRatio(e.target.value as any)}
                        className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-xs rounded-xl p-3 outline-none cursor-pointer"
                      >
                        <option value="16:9">Wide (16:9)</option>
                        <option value="1:1">Square (1:1)</option>
                        <option value="9:16">Story (9:16)</option>
                        <option value="4:3">Photo (4:3)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="font-headline text-xs font-semibold text-primary" htmlFor="feedbackText">Feedback for Visual Refinement (Imagen 3)</label>
                    <input
                      id="feedbackText"
                      type="text"
                      placeholder="e.g. Make background darker, add flowers, make it brighter..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-xs rounded-xl p-3 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-4 border-t border-outline-variant/10 pt-4">
                    <button
                      onClick={handleSaveTextEdits}
                      disabled={isSavingProduct}
                      className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-label text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProduct ? "Saving..." : "Save Copy Details"}
                    </button>
                    <button
                      onClick={handleRegenerateBanner}
                      disabled={isSavingProduct}
                      className="flex-1 py-3 bg-primary text-on-primary hover:opacity-95 rounded-xl font-label text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                      Refine Campaign Visual
                    </button>
                  </div>

                  {selectedProduct.bannerHistory && selectedProduct.bannerHistory.length > 1 && (
                    <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-4 mt-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-outline">Visual Versions History</span>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {selectedProduct.bannerHistory.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectHistoryBanner(img)}
                            className={`w-20 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 ${
                              selectedProduct.campaignImage === img ? "border-primary shadow-sm" : "border-outline-variant/35 hover:border-outline"
                            }`}
                          >
                            <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrandPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-on-surface-variant font-medium font-sans">Loading...</p>
        </div>
      }>
        <BrandContent />
      </Suspense>
    </DashboardLayout>
  );
}
