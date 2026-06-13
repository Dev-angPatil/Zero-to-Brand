"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
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
  audioTheme: {
    tempo: number;
    scale: "major" | "minor" | "pentatonic";
    instrument: "acoustic" | "warm-synth" | "bell";
    mood: "organic" | "modern" | "luxury";
  };
}

interface Brand {
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
}

export default function Storefront() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!brandId) return;

    const loadStore = async () => {
      try {
        // 1. Fetch brand details
        const res = await fetch(`/api/brands?id=${brandId}`);
        if (res.ok) {
          const brandData = (await res.json()) as Brand;
          if (!brandData.brandVariables) {
            router.push("/");
            return;
          }
          setBrand(brandData);

          // 2. Fetch products details
          const prodRes = await fetch(`/api/products?brandId=${brandId}`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProducts(prodData);
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading storefront:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadStore();

    return () => {
      stopJingle();
    };
  }, [brandId, router]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  // --- Web Audio Synth logic (Simplified version for store) ---
  const startJingle = () => {
    if (!brand) return;
    const theme = brand.brandVariables.audioTheme;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

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
        [130.81, 164.81, 220.0],
      ],
      major: [
        [130.81, 164.81, 196.0],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
      ],
      minor: [
        [110.0, 130.81, 164.81],
        [146.83, 174.61, 220.0],
        [130.81, 164.81, 196.0],
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
      gainNode.connect(audioCtxRef.current.destination);

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
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.05 : 0.08, t + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else if (theme.instrument === "warm-synth") {
        osc.type = "triangle";
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(1200, t + 0.04);
        osc.disconnect(gainNode);
        osc.connect(filter);
        filter.connect(gainNode);

        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.03 : 0.06, t + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else {
        osc.type = "sine";
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.05 : 0.1, t + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      }

      osc.start(t);
      osc.stop(t + duration);
    };

    const scheduleNotes = () => {
      if (!audioCtxRef.current) return;
      const now = ctx.currentTime;
      const schedTime = now + 0.05;

      const chordIndex = Math.floor(stepCount / 8) % chords.length;
      const currentChord = chords[chordIndex];

      if (stepCount % 8 === 0) {
        currentChord.forEach((freq) => {
          playSynth(freq, schedTime, 1.6, true);
        });
      }

      if (stepCount % 2 === 0 || Math.random() > 0.5) {
        const noteIndex = (stepCount * 2 + Math.floor(Math.random() * 2)) % notes.length;
        playSynth(notes[noteIndex] * 2, schedTime, 0.4, false);
      }

      stepCount++;
    };

    scheduleNotes();
    loopIntervalRef.current = setInterval(scheduleNotes, intervalMs);
  };

  const stopJingle = () => {
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

  const toggleJingle = () => {
    if (isPlaying) stopJingle();
    else startJingle();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Syncing live catalog...</p>
      </div>
    );
  }

  if (!brand) return null;

  const brandVars = brand.brandVariables;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-all duration-300 relative overflow-x-hidden pb-12"
      style={{
        backgroundColor: brandVars.colors.background,
        color: brandVars.colors.primary,
      }}
    >
      <style jsx global>{`
        .custom-primary-bg {
          background-color: ${brandVars.colors.primary};
        }
        .custom-primary-text {
          color: ${brandVars.colors.primary};
        }
        .custom-secondary-bg {
          background-color: ${brandVars.colors.secondary};
        }
        .custom-secondary-border {
          border-color: ${brandVars.colors.secondary};
        }
        .custom-primary-border {
          border-color: ${brandVars.colors.primary};
        }
        .custom-btn-hover:hover {
          background-color: ${brandVars.colors.primary}dd;
        }
      `}</style>

      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center max-w-7xl mx-auto border-b border-current/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            {brandVars.logoImage ? (
              <img
                src={brandVars.logoImage}
                alt={`${brandVars.brandName} Logo`}
                className="w-full h-full object-cover rounded-full shadow-sm border border-current/10 bg-white/20"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center p-0.5"
                dangerouslySetInnerHTML={{ __html: brandVars.logoSvg }}
              />
            )}
          </div>
          <span className="font-sans font-bold text-xl uppercase tracking-wider">
            {brandVars.brandName}
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider opacity-85">
          <a href="#about" className="hover:opacity-100 transition-opacity">
            Our Story
          </a>
          <a href="#products" className="hover:opacity-100 transition-opacity">
            Campaign Catalog
          </a>
          <a href="#subscribe" className="hover:opacity-100 transition-opacity">
            Kiln Updates
          </a>
        </nav>
        <div>
          <a
            href="#products"
            className="text-xs uppercase font-bold tracking-widest px-6 py-2.5 rounded-full border border-current hover:bg-current hover:text-white transition-all duration-200"
            style={{ color: brandVars.colors.primary }}
          >
            Shop Catalog
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main id="about" className="max-w-7xl mx-auto px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 border-b border-current/5">
        {/* Text Area */}
        <section className="flex-1 flex flex-col gap-6 items-start">
          <span
            className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-bold border rounded-full custom-secondary-border"
            style={{ color: brandVars.colors.primary }}
          >
            Artisan Boutique
          </span>
          <h1 className="font-sans font-extrabold text-4xl md:text-6xl tracking-tight leading-none">
            {brandVars.tagline}
          </h1>
          <p className="text-lg opacity-85 leading-relaxed font-sans max-w-lg">
            {brandVars.brandDescription}
          </p>
          <a
            href="#products"
            className="mt-4 px-8 py-4 rounded-full text-white font-bold tracking-wide transition-all custom-primary-bg custom-btn-hover shadow-lg"
            style={{
              backgroundColor: brandVars.colors.primary,
            }}
          >
            Explore Handcrafted Collection
          </a>
        </section>

        {/* Hero Visual Area */}
        <section className="flex-1 w-full max-w-md md:max-w-none flex justify-center">
          <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-2xl border border-current/10 bg-white/10 p-4">
            <img
              alt={brandVars.brandName}
              className="w-full h-full object-cover rounded-[24px]"
              src={brandVars.bannerImage || brand.rawImage}
            />
          </div>
        </section>
      </main>

      {/* Products Showcase Catalog Grid */}
      <section id="products" className="max-w-7xl mx-auto px-8 py-16 flex flex-col gap-10">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-3xl font-extrabold uppercase tracking-wide">Signature Catalog</h2>
          <p className="text-sm opacity-80 mt-2">
            Each batch is generated in limited runs, embodying raw textures and ancestral craftsmanship.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 opacity-70">
            <span className="material-symbols-outlined text-4xl mb-2">grid_view</span>
            <p className="font-semibold text-sm">No items in batch currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white/10 backdrop-blur-md rounded-[32px] overflow-hidden border border-current/10 shadow flex flex-col h-full hover:shadow-lg transition-shadow"
              >
                {/* Visual Banner */}
                <div className="h-56 relative overflow-hidden bg-white/5 border-b border-current/5">
                  <img
                    src={prod.campaignImage || prod.rawImage}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/40 text-white rounded-full text-[10px] uppercase font-mono tracking-widest">
                    Craft Batch
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-grow flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-75 italic">
                      &ldquo;{prod.tagline}&rdquo;
                    </span>
                    <h3 className="text-xl font-bold uppercase tracking-wider">{prod.name}</h3>
                    <p className="text-xs opacity-80 leading-relaxed font-sans mt-1">
                      {prod.description}
                    </p>
                  </div>

                  {/* Specific craftsmanship & tags */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-current/10 mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">Materials:</span>
                      <div className="flex flex-wrap gap-1">
                        {prod.materials.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-current/5 rounded text-[10px] font-bold">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    {prod.craftsmanship && (
                      <div className="text-[11px] opacity-75 italic leading-snug">
                        <strong>Heritage:</strong> {prod.craftsmanship.substring(0, 120)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sonic Player & Newsletter Section */}
      <section id="subscribe" className="w-full py-16 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center border-t border-current/10 mt-12">
        {/* Left: Sonic Player */}
        <div className="flex-1 p-8 rounded-[32px] border border-current/10 bg-white/20 backdrop-blur-sm flex flex-col items-center text-center gap-4 w-full">
          <span className="material-symbols-outlined text-4xl animate-pulse">
            volume_up
          </span>
          <h3 className="font-bold text-lg uppercase tracking-wider">
            Ambient Sonic Identity
          </h3>
          <p className="text-xs opacity-75 max-w-xs leading-relaxed">
            Listen to the procedural musical theme composed in real-time by our design copilot to match the exact aesthetic frequency of our craft.
          </p>
          <button
            onClick={toggleJingle}
            className="mt-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all flex items-center gap-2 custom-primary-bg hover:opacity-90 cursor-pointer shadow"
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
            {isPlaying ? "Pause Theme" : "Play Sonic Theme"}
          </button>
        </div>

        {/* Right: Newsletter */}
        <div className="flex-grow flex flex-col gap-4 items-start w-full">
          <h3 className="font-headline text-3xl tracking-tight leading-none font-bold">
            Join the Next Batch Release
          </h3>
          <p className="text-sm opacity-85 max-w-md">
            Our items are made in single limited runs. Subscribe to get notified on kiln opening days and fresh listings.
          </p>
          {subscribed ? (
            <div className="p-4 rounded-xl border border-current/20 bg-white/30 text-sm font-semibold animate-fade-in">
              Thank you! You are now subscribed to batch updates.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-grow bg-white/30 border border-current/20 rounded-full py-3 px-5 text-sm focus:ring-1 focus:ring-current outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-white font-bold text-sm custom-primary-bg hover:opacity-90 transition-all cursor-pointer shadow"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-8 border-t border-current/10 text-center text-xs opacity-65 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto gap-4 mt-8">
        <div>
          &copy; {new Date().getFullYear()} {brandVars.brandName}. All rights reserved.
        </div>
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <span className="font-bold tracking-widest uppercase">Zero to Brand</span>
        </div>
      </footer>
    </div>
  );
}
