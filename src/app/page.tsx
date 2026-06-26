"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface BrandVariables {
  brandName: string;
  brandDescription: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  logoSvg: string;
  logoImage?: string;
  bannerImage?: string;
  adBannerCopy: string;
  audioTheme: {
    tempo: number;
    scale: "major" | "minor" | "pentatonic";
    instrument: "acoustic" | "warm-synth" | "bell";
    mood: "organic" | "modern" | "luxury";
  };
}

interface Brand {
  id: string;
  status: string;
  rawImage: string;
  brandVariables?: BrandVariables;
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

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraftId = searchParams.get("draftId");

  // State
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Brand creation state
  const [onboardImage, setOnboardImage] = useState<string | null>(null);
  const [isUploadingBrand, setIsUploadingBrand] = useState(false);
  const [uploadBrandProgress, setUploadBrandProgress] = useState("");

  // Product addition state
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [uploadProductProgress, setUploadProductProgress] = useState("");

  // Product questionnaire modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProductImage, setPendingProductImage] = useState<string | null>(null);
  const [productScene, setProductScene] = useState("");
  const [productTone, setProductTone] = useState("Earthy & Organic");
  const [productKeywords, setProductKeywords] = useState("");

  // Product Customization Console state
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

  // Sonic Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>([10, 10, 10, 10, 10]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStateRef = useRef<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopJingle();
    };
  }, []);

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

  // Context loading
  useEffect(() => {
    const activeId = localStorage.getItem("activeBrandId");
    const targetId = activeId || queryDraftId;

    if (!targetId) {
      router.push("/login");
      return;
    }

    const loadBrandWorkspace = async () => {
      try {
        const res = await fetch(`/api/brands?id=${targetId}`);
        if (res.ok) {
          const brandData = (await res.json()) as Brand;
          setActiveBrand(brandData);
          setOnboardImage(brandData.rawImage);

          if (brandData.status === "completed") {
            // Load products
            const prodRes = await fetch(`/api/products?brandId=${targetId}`);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              setProducts(prodData);
            }
          }
        } else {
          localStorage.removeItem("activeBrandId");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error loading brand workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandWorkspace();
  }, [queryDraftId, router]);

  // Handle file select and upload for new brand onboarding
  const handleBrandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processBrandFile(file);
  };

  const processBrandFile = async (file: File) => {
    if (!queryDraftId) return;
    setIsUploadingBrand(true);
    setUploadBrandProgress("Reading raw craft photo...");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        if (!base64Image) throw new Error("Failed to read file");

        setOnboardImage(base64Image);
        setUploadBrandProgress("Updating brand sandbox...");

        // Update brand raw image
        const updateRes = await fetch(`/api/brands?id=${queryDraftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawImage: base64Image }),
        });

        if (!updateRes.ok) throw new Error("Failed to update brand image");

        setUploadBrandProgress("Gemini is analyzing details...");
        const ingestRes = await fetch("/api/gemini/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: queryDraftId }),
        });

        if (!ingestRes.ok) throw new Error("Failed to re-analyze image");

        setIsUploadingBrand(false);
        router.push(`/config?draftId=${queryDraftId}`);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Onboarding image upload error:", error);
      alert("Error processing file. Please try again.");
      setIsUploadingBrand(false);
    }
  };

  // Handle file upload for new product campaign
  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processProductFile(file);
  };

  const processProductFile = async (file: File) => {
    if (!activeBrand) return;
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
    if (!activeBrand || !pendingProductImage) return;
    setIsProductModalOpen(false);
    setIsUploadingProduct(true);
    setUploadProductProgress("Ingesting craft materials...");

    try {
      setUploadProductProgress("Gemini copywriting & modular agents running...");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: activeBrand.id,
          rawImage: pendingProductImage,
          sceneDescription: productScene,
          adCopyTone: productTone,
          keywords: productKeywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        // Refresh products catalog list
        const prodRes = await fetch(`/api/products?brandId=${activeBrand.id}`);
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

  const downloadPosterImage = (product: Product, brandVars: BrandVariables) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Background fill
    ctx.fillStyle = brandVars.colors.background || "#f7faf2";
    ctx.fillRect(0, 0, 800, 1200);

    // 2. Draw border
    ctx.strokeStyle = brandVars.colors.primary || "#264e2b";
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, 740, 1140);
    
    // 3. Draw a inner thin border
    ctx.strokeStyle = brandVars.colors.secondary || "#fcd03d";
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 710, 1110);

    // 4. Draw Brand Name (Top Center)
    ctx.fillStyle = brandVars.colors.primary || "#264e2b";
    ctx.textAlign = "center";
    ctx.font = "bold 32px Georgia, serif";
    ctx.fillText(brandVars.brandName.toUpperCase(), 400, 100);

    // 5. Draw Brand Tagline
    ctx.font = "italic 18px Arial, sans-serif";
    ctx.fillStyle = brandVars.colors.primary || "#264e2b";
    ctx.fillText(`“ ${brandVars.tagline} ”`, 400, 130);

    // 6. Draw Studio Product Image (Center)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 80, 180, 640, 500);

      // 7. Draw star emblem overlay
      ctx.fillStyle = brandVars.colors.secondary || "#fcd03d";
      ctx.beginPath();
      ctx.arc(400, 180, 40, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = brandVars.colors.primary || "#264e2b";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText("★", 400, 188);

      // 8. Draw Product Title (Below image)
      ctx.fillStyle = brandVars.colors.primary || "#264e2b";
      ctx.font = "bold 44px Georgia, serif";
      ctx.fillText(product.name, 400, 750);

      // 9. Draw Product Tagline
      ctx.font = "italic 22px Arial, sans-serif";
      ctx.fillStyle = brandVars.colors.secondary || "#fcd03d";
      ctx.fillText(product.tagline, 400, 790);

      // 10. Draw Product Description (Wrapped paragraphs)
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

      // 11. Draw Keywords (Bottom tags)
      const tags = product.keywords || [];
      if (tags.length > 0) {
        ctx.font = "bold 14px Arial, sans-serif";
        ctx.fillStyle = brandVars.colors.primary || "#264e2b";
        ctx.fillText(tags.map((t) => `#${t}`).join("  •  "), 400, 1080);
      }

      // 12. Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${product.name.toLowerCase().replace(/\s+/g, "_")}_poster.png`;
      link.href = dataUrl;
      link.click();
    };
    
    img.src = product.campaignImage || product.rawImage;
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
          regenerate: true
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropBrand = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processBrandFile(file);
  };

  const handleDropProduct = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processProductFile(file);
  };

  // --- Web Audio Synth logic ---
  const startJingle = () => {
    if (!activeBrand || !activeBrand.brandVariables) return;
    const theme = activeBrand.brandVariables.audioTheme;

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
  };

  const handlePlayToggle = () => {
    if (isPlaying) stopJingle();
    else startJingle();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Loading Studio Vault...</p>
      </div>
    );
  }

  // --- BRAND ONBOARDING IN PROGRESS INTERFACE ---
  const isOnboarding = activeBrand && activeBrand.status === "in_progress";
  if (isOnboarding && queryDraftId) {
    return (
      <div className="max-w-[1400px] w-full mx-auto flex flex-col lg:flex-row gap-lg pb-12">
        <section className="lg:w-[65%] flex flex-col gap-md">
          <div className="mb-4">
            <h2 className="font-headline text-3xl md:text-4xl text-on-surface mb-2">
              Creative Studio
            </h2>
            <p className="text-on-surface-variant text-body-md">
              Configure your signature seed craft. We support JPG, PNG, and HEIC.
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDropBrand}
            onClick={!isUploadingBrand ? triggerFileInput : undefined}
            className={`relative w-full aspect-[4/3] rounded-[24px] dashed-terracotta bg-surface-container flex flex-col items-center justify-center p-8 text-center transition-all duration-300 group overflow-hidden ${
              isUploadingBrand ? "cursor-wait bg-surface-container-high" : "cursor-pointer hover:bg-surface-container-high"
            }`}
          >
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply pointer-events-none"></div>

            {isUploadingBrand ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full border-4 border-primary border-t-secondary animate-spin flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                </div>
                <h3 className="font-headline text-2xl text-primary animate-pulse">{uploadBrandProgress}</h3>
              </div>
            ) : onboardImage ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                <img
                  src={onboardImage}
                  alt="Onboard Seed Craft"
                  className="max-h-[70%] object-contain rounded-xl shadow-md border border-outline-variant/35 mb-4"
                />
                <button
                  type="button"
                  className="px-6 py-2 bg-primary text-on-primary rounded-full hover:opacity-90 font-label text-xs shadow transition-all"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-6 soft-shadow organic-border group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[48px] text-secondary">photo_camera</span>
                </div>
                <h3 className="font-headline text-2xl text-on-surface mb-2">Drag &amp; Drop Seed Craft Photo</h3>
                <p className="text-on-surface-variant max-w-sm text-body-md px-4">
                  Upload a photo of your signature craft to establish the color palettes, textures, and heritage of your brand.
                </p>
                <button
                  type="button"
                  className="mt-8 px-8 py-3 bg-primary text-on-primary font-label text-label-md rounded-[16px] hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  Browse Craft
                </button>
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBrandFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploadingBrand}
            />
          </div>
        </section>

        <aside className="lg:w-[35%] flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-outline-variant/30 pt-8 lg:pt-0 lg:pl-8">
          <div>
            <h3 className="font-headline text-2xl text-on-surface mb-4">Onboarding Active</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              You are currently onboarding a new brand identity. You must complete the setup process before launching products.
            </p>
          </div>
          {onboardImage && (
            <button
              onClick={() => router.push(`/config?draftId=${queryDraftId}`)}
              className="w-full mt-8 py-4 bg-primary text-on-primary font-label text-label-md rounded-xl hover:bg-primary-container shadow flex items-center justify-center gap-2"
            >
              Continue to Vibe Config
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          )}
        </aside>
      </div>
    );
  }

  // --- BRAND COMPLETED WORKSPACE INTERFACE ---
  const brandVars = activeBrand?.brandVariables;
  if (!brandVars) return null;

  return (
    <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-8 pb-32">
      {/* Active Brand Hub Card */}
      <section
        className="w-full rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center border border-outline-variant/30 relative overflow-hidden shadow-sm transition-all duration-300"
        style={{
          backgroundColor: `${brandVars.colors.background}`,
          color: `${brandVars.colors.primary}`,
        }}
      >
        {/* Dynamic color highlights */}
        <style jsx>{`
          .colors-border {
            border-color: ${brandVars.colors.primary}33;
          }
          .custom-pill {
            background-color: ${brandVars.colors.secondary}15;
            color: ${brandVars.colors.primary};
            border-color: ${brandVars.colors.secondary}40;
          }
        `}</style>

        {/* Brand visual logo mark */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-white/40 flex items-center justify-center flex-shrink-0 border border-black/5 shadow-sm p-4">
          {brandVars.logoImage ? (
            <img src={brandVars.logoImage} alt="Brand Logo" className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: brandVars.logoSvg }} />
          )}
        </div>

        {/* Text Variables */}
        <div className="flex-grow flex flex-col gap-2 text-center md:text-left min-w-0">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <span className="px-3 py-0.5 border text-[10px] font-bold uppercase tracking-widest rounded-full custom-pill">
              Active Brand Hub
            </span>
            <span className="text-xs font-mono opacity-80">ID: {activeBrand?.id}</span>
          </div>
          <h1 className="font-headline text-3xl md:text-4xl tracking-tight leading-none font-bold truncate">
            {brandVars.brandName}
          </h1>
          <p className="text-sm font-mono opacity-90 italic">&ldquo;{brandVars.tagline}&rdquo;</p>
          <p className="text-xs opacity-80 leading-relaxed max-w-xl mt-1">
            {brandVars.brandDescription}
          </p>

          {/* Colors Swatches */}
          <div className="flex gap-2 items-center justify-center md:justify-start mt-2">
            <span className="text-[11px] uppercase font-mono mr-1">Brand Palette:</span>
            <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: brandVars.colors.primary }} title="Primary" />
            <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: brandVars.colors.secondary }} title="Secondary" />
            <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: brandVars.colors.background }} title="Background" />
          </div>
        </div>

        {/* Sonic Identity procedurally generated jingle */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3 p-4 bg-white/25 rounded-2xl border colors-border w-full md:w-auto">
          <div className="flex items-end gap-1 h-10">
            {audioBars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{ height: `${h}px`, backgroundColor: brandVars.colors.primary }}
              />
            ))}
          </div>
          <button
            onClick={handlePlayToggle}
            className="px-5 py-2.5 rounded-full font-bold text-xs shadow hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5 text-white"
            style={{ backgroundColor: brandVars.colors.primary }}
          >
            <span className="material-symbols-outlined text-sm">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
            {isPlaying ? "Stop Sonic Mark" : "Listen Sonic Mark"}
          </button>
        </div>
      </section>

      {/* Main Grid: Products and Upload Zone */}
      <div className="flex flex-col lg:flex-row gap-gutter mt-4">
        {/* Left Side: Product catalog list */}
        <section className="lg:w-[65%] flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
            <h2 className="font-headline text-2xl text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">inventory_2</span>
              Product Campaigns
            </h2>
            <span className="text-xs font-mono text-outline">{products.length} Products</span>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low rounded-[24px] border border-outline-variant/30 p-8 text-on-surface-variant flex flex-col items-center gap-2">
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
                  className="bg-surface-container-low border border-outline-variant/30 rounded-[24px] overflow-hidden flex flex-col transform hover:-translate-y-1 transition-all duration-300 relative group shadow-sm hover:shadow-md cursor-pointer"
                >
                  {/* Campaign Banner visual */}
                  <div className="h-44 relative overflow-hidden bg-surface-container flex items-center justify-center border-b border-outline-variant/25">
                    {prod.campaignImage ? (
                      <img src={prod.campaignImage} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={prod.rawImage} alt={prod.name} className="w-full h-full object-cover filter saturate-[0.8]" />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/45 text-white rounded text-[9px] font-mono uppercase tracking-wider">
                      Live Catalog
                    </div>
                  </div>

                  {/* Body details */}
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

                    {/* Materials tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prod.materials.slice(0, 3).map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[9px] font-semibold border border-outline-variant/20">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete Button */}
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
            <h2 className="font-headline text-2xl text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">add_circle</span>
              Add Product
            </h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDropProduct}
            onClick={!isUploadingProduct ? triggerFileInput : undefined}
            className={`w-full aspect-[4/3] rounded-[24px] dashed-terracotta bg-surface-container-low flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group overflow-hidden border border-outline-variant/30 ${
              isUploadingProduct ? "cursor-wait bg-surface-container-high" : "cursor-pointer hover:bg-surface-container-high"
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

          <div className="bg-surface-container-low p-5 rounded-[24px] border border-outline-variant/30 flex flex-col gap-2">
            <h4 className="font-headline text-md text-primary font-bold">Campaign Integration</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Every product added represents a new campaign slot. Gemini automatically incorporates your brand&apos;s philosophy and aesthetic dials into each listing. Banners are rendered using Imagen 3 in a setting tailored to your vibe.
            </p>
          </div>
        </section>
      </div>

      {/* Product Campaign Console Drawer */}
      {isDrawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop blur overlay */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer content panel */}
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
                {/* Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-6">
                  <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">edit_note</span>
                    Campaign Console
                  </h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Tab Navigation */}
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

                {/* Tab Content */}
                {activeTab === "poster" && activeBrand?.brandVariables && (
                  <div className="flex flex-col gap-4 animate-fade-in mb-6">
                    {/* HTML Poster Preview */}
                    <div 
                      className="w-full rounded-[24px] border p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden"
                      style={{ 
                        backgroundColor: activeBrand.brandVariables.colors.background,
                        borderColor: activeBrand.brandVariables.colors.primary,
                        borderWidth: "12px"
                      }}
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 pointer-events-none"></div>
                      
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-outline">
                        {activeBrand.brandVariables.brandName}
                      </span>
                      <h4 className="font-headline text-lg font-bold text-on-surface leading-none mt-1">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-[11px] font-mono text-secondary font-bold uppercase tracking-wider italic mt-0.5">
                        &ldquo;{selectedProduct.tagline}&rdquo;
                      </p>

                      <div className="w-full aspect-video rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-high my-4">
                        <img 
                          src={selectedProduct.campaignImage || selectedProduct.rawImage} 
                          alt="Poster Studio Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                        {selectedProduct.description}
                      </p>

                      {selectedProduct.keywords && selectedProduct.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-3">
                          {selectedProduct.keywords.map((kw, idx) => (
                            <span key={idx} className="text-[10px] font-bold font-mono text-primary/80">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => downloadPosterImage(selectedProduct, activeBrand.brandVariables!)}
                      className="w-full py-3 bg-secondary text-on-secondary rounded-xl font-label text-xs font-bold hover:opacity-95 shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download Marketing Poster
                    </button>
                  </div>
                )}

                {activeTab === "studio" && (
                  <div className="w-full aspect-video rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container mb-6 relative animate-fade-in">
                    <img
                      src={selectedProduct.campaignImage || selectedProduct.rawImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 text-white rounded text-[9px] font-mono">
                      Generated Studio Image (Imagen 3.0)
                    </div>
                  </div>
                )}

                {activeTab === "raw" && (
                  <div className="w-full aspect-video rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container mb-6 relative animate-fade-in">
                    <img
                      src={selectedProduct.rawImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 text-white rounded text-[9px] font-mono">
                      Original Uploaded Craft Photo
                    </div>
                  </div>
                )}

                {/* Banner History Strip */}
                {(() => {
                  const history = selectedProduct.bannerHistory || (selectedProduct.campaignImage ? [selectedProduct.campaignImage] : []);
                  if (history.length <= 1) return null;
                  return (
                    <div className="mb-6 flex flex-col gap-2">
                      <label className="text-[10px] font-bold font-label uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-primary">history</span>
                        Banner Version History ({history.length} versions)
                      </label>
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                        {history.map((img, index) => {
                          const isActive = selectedProduct.campaignImage === img;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectHistoryBanner(img)}
                              disabled={isSavingProduct}
                              className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all relative cursor-pointer ${
                                isActive
                                  ? "border-primary shadow-md scale-95"
                                  : "border-outline-variant/50 hover:border-outline opacity-75 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Banner Version ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/40 text-[8px] text-white text-center py-0.5 font-mono">
                                v{index + 1}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Edit Form */}
                <div className="flex-grow flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                      Campaign Product Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                      Marketing Tagline
                    </label>
                    <input
                      type="text"
                      value={editTagline}
                      onChange={(e) => setEditTagline(e.target.value)}
                      className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none italic"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                      Product Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="w-full h-px bg-outline-variant/30 my-2"></div>

                  {/* Banner Aspect Ratio Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                      Banner Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["16:9", "1:1", "9:16", "4:3"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setEditAspectRatio(ratio)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                            editAspectRatio === ratio
                              ? "bg-primary/10 border-primary text-primary shadow-sm"
                              : "bg-surface border-outline-variant hover:bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {ratio === "16:9" && "16:9 Wide"}
                          {ratio === "1:1" && "1:1 Square"}
                          {ratio === "9:16" && "9:16 Story"}
                          {ratio === "4:3" && "4:3 Classic"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style Preset Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                      Style Preset Mood
                    </label>
                    <select
                      value={editStylePreset}
                      onChange={(e) => setEditStylePreset(e.target.value as "solarpunk" | "cyberpunk" | "minimalist" | "vintage" | "cozy")}
                      className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface cursor-pointer"
                    >
                      <option value="solarpunk">Solarpunk (Organic Eco-tech)</option>
                      <option value="cyberpunk">Cyberpunk (Neon Nightscape)</option>
                      <option value="minimalist">Studio Minimalist (Diffused Beige)</option>
                      <option value="vintage">Warm Vintage (Retro Woodglow)</option>
                      <option value="cozy">Cinematic Cozy (Warm Sunflare)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold font-label uppercase tracking-wider text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">auto_fix_high</span>
                        Instruct Imagen Banner updates
                      </label>
                      <span className="text-[10px] text-outline font-mono">Gemini prompt engineer</span>
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. 'place it on a dark oak shelf', 'change the lighting to soft warm sunset lights', 'add wild lavender in the background'..."
                      rows={2}
                      className="bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 px-4 text-sm outline-none resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-outline leading-snug">
                      Your feedback will be combined with the raw visual details of your craft photo using Gemini to paint a highly aligned marketing banner.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 border-t border-outline-variant/20 pt-4 mt-6">
                  <button
                    onClick={() => {
                      if (confirm("Delete this product campaign?")) {
                        deleteProduct(null, selectedProduct.id);
                        setIsDrawerOpen(false);
                      }
                    }}
                    className="px-4 py-3 border border-error text-error hover:bg-error/5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer animate-fade-in"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                  <button
                    onClick={handleSaveTextEdits}
                    disabled={isSavingProduct || isRegeneratingProduct}
                    className="flex-1 py-3 border border-primary text-primary hover:bg-primary/5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProduct ? "Saving..." : "Save Texts"}
                  </button>
                  {(feedbackText.trim() !== "" ||
                    editStylePreset !== (selectedProduct.stylePreset || "solarpunk") ||
                    editAspectRatio !== (selectedProduct.aspectRatio || "16:9")) && (
                    <button
                      onClick={handleRegenerateBanner}
                      disabled={isSavingProduct || isRegeneratingProduct}
                      className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container hover:text-on-primary-container shadow transition-all cursor-pointer flex items-center justify-center gap-1 animate-fade-in"
                    >
                      <span className="material-symbols-outlined text-sm">palette</span>
                      Paint Banner
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Onboarding Questionnaire Modal */}
      {isProductModalOpen && pendingProductImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop blur overlay */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-md transition-opacity"
            onClick={() => {
              setIsProductModalOpen(false);
              setPendingProductImage(null);
            }}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-surface border-2 border-primary/20 rounded-[28px] shadow-2xl flex flex-col p-8 overflow-y-auto max-h-[90vh] animate-scale-up text-on-surface z-10">
            {/* Solar flare design background detail */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4 mb-6 relative">
              <div>
                <h3 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">temp_preferences_custom</span>
                  Campaign Settings
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Help Gemini and Imagen craft the perfect advertisement and poster setting for your product.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setPendingProductImage(null);
                }}
                className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Content Form */}
            <div className="flex flex-col gap-5 relative">
              {/* Product Preview Thumbnail */}
              <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                  <img src={pendingProductImage} alt="Pending Product" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-label uppercase tracking-wide text-primary">Raw Photo Loaded</h4>
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">
                    Gemini will analyze textures, craftsmanship, and materials directly from this image.
                  </p>
                </div>
              </div>

              {/* Scene Backdrop Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                    Desired Scene Backdrop
                  </label>
                  <span className="text-[10px] text-outline font-mono">Imagen 3 setting</span>
                </div>
                <select
                  value={productScene}
                  onChange={(e) => setProductScene(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface cursor-pointer"
                >
                  <option value="">(Default) Seamless studio background tailored to brand vibe</option>
                  <option value="minimalist sun-drenched concrete plinth with soft eucalyptus shadows">Minimalist Plinth &amp; Eucalyptus Shadows</option>
                  <option value="warm, rustic reclaimed oak tabletop, soft ambient sunflare background">Cozy Reclaimed Oak Tabletop</option>
                  <option value="outdoor raw mossy forest stone ledge, natural morning dew, soft focus pine trees">Mossy Forest Ledge (Outdoors)</option>
                  <option value="modern clean kitchen counter, bright natural window light, elegant organic backdrop">Bright Modern Kitchen Counter</option>
                  <option value="sleek dark slate slab, dramatic spotlight, premium luxury mist">Premium Dark Slate (Dramatic Spotlight)</option>
                  <option value="eco-friendly bamboo stand in a lush indoor greenhouse conservatory, diffused skylight">Greenhouse Conservatory (Eco-tech)</option>
                </select>
                <p className="text-[10px] text-outline leading-snug">
                  If left default, the modular Preference/Designer Agent uses your brand&apos;s dials to formulate a contextually perfect backdrop.
                </p>
              </div>

              {/* Ad Copy Copywriting Tone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                  Ad Copywriting Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { tone: "Earthy & Organic", desc: "Sustainable & Warm" },
                    { tone: "Exquisite & Modern", desc: "Refined & Sleek" },
                    { tone: "Minimalist & Bold", desc: "Clean & Punchy" }
                  ].map((item) => (
                    <button
                      key={item.tone}
                      type="button"
                      onClick={() => setProductTone(item.tone)}
                      className={`py-2.5 px-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                        productTone === item.tone
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-surface border-outline-variant hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <span className="font-semibold">{item.tone}</span>
                      <span className="text-[8px] opacity-75 font-normal">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords Tagging */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant">
                    Marketing Keywords / Hashtags
                  </label>
                  <span className="text-[10px] text-outline font-mono">Comma-separated</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. handmade, organic, solarpunk, earthware, timeless"
                  value={productKeywords}
                  onChange={(e) => setProductKeywords(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-xl py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder:text-outline/60"
                />
                <p className="text-[10px] text-outline leading-snug">
                  These keywords are utilized by the Designer Agent to frame the layout and are featured at the bottom of your marketing poster.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 border-t border-outline-variant/30 pt-5 mt-6 relative">
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setPendingProductImage(null);
                }}
                className="flex-1 py-3 border border-outline hover:bg-surface-container-low rounded-xl text-xs font-bold transition-colors cursor-pointer text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={submitProductCampaign}
                className="flex-grow flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-on-surface-variant font-medium">Loading Workspace...</p>
        </div>
      }>
        <StudioContent />
      </Suspense>
    </DashboardLayout>
  );
}
