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

interface Draft {
  id: string;
  rawImage: string;
  brandVariables: BrandVariables;
}

function BrandContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>([10, 10, 10, 10, 10]);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const loopIntervalRef = useRef<any>(null);
  const playStateRef = useRef<boolean>(false);

  // Load draft data
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

        // Map frequency bins to 5 bars
        const step = Math.floor(dataArray.length / 5);
        const newBars = [0, 0, 0, 0, 0].map((_, i) => {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j];
          }
          const avg = sum / step;
          // Scale to height percentage (10 to 80px)
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

    // 1. Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 32;
    analyserRef.current = analyser;

    // Connect to speakers
    analyser.connect(ctx.destination);
    playStateRef.current = true;
    setIsPlaying(true);

    const tempo = theme.tempo || 90;
    const intervalMs = (60 / tempo) * 1000 * 0.5; // Eighth note beats

    // Defined scales (Hz values for melody)
    const scales = {
      pentatonic: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C Major Pentatonic (C4, D4, E4, G4, A4, C5)
      major: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25], // C Major
      minor: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0], // A Minor
    };

    const notes = scales[theme.scale] || scales.pentatonic;

    // Chord progressions depending on scale
    const chordProgressions = {
      pentatonic: [
        [130.81, 164.81, 196.0], // C major (C3, E3, G3)
        [146.83, 174.61, 220.0], // D minor
        [164.81, 196.0, 246.94], // E minor
        [130.81, 164.81, 220.0], // A minor
      ],
      major: [
        [130.81, 164.81, 196.0], // C major
        [174.61, 220.0, 261.63], // F major
        [196.0, 246.94, 293.66], // G major
        [110.0, 130.81, 164.81], // A minor
      ],
      minor: [
        [110.0, 130.81, 164.81], // A minor (A2, C3, E3)
        [146.83, 174.61, 220.0], // D minor
        [130.81, 164.81, 196.0], // C major
        [164.81, 207.65, 246.94], // E major
      ],
    };

    const chords = chordProgressions[theme.scale] || chordProgressions.pentatonic;
    let stepCount = 0;

    // Simple Synth trigger
    const playSynth = (freq: number, start: number, duration: number, isChord = false) => {
      if (!audioCtxRef.current) return;
      const t = start;

      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(analyser);

      osc.frequency.setValueAtTime(freq, t);

      // Instrument settings
      if (theme.instrument === "bell") {
        // FM Synthesis for bell tone
        osc.type = "sine";
        // Modulator
        const mod = audioCtxRef.current.createOscillator();
        const modGain = audioCtxRef.current.createGain();
        mod.frequency.setValueAtTime(freq * 1.414, t); // Inharmonic ratio
        modGain.gain.setValueAtTime(freq * 0.8, t);
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        mod.start(t);
        mod.stop(t + duration);

        // Envelope
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.08 : 0.12, t + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else if (theme.instrument === "warm-synth") {
        // Subtractive filter sweep
        osc.type = "triangle";
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
        filter.frequency.exponentialRampToValueAtTime(300, t + duration);

        osc.disconnect(gainNode);
        osc.connect(filter);
        filter.connect(gainNode);

        // Envelope
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.06 : 0.1, t + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else {
        // Acoustic pluck (sine + decay filter)
        osc.type = "sine";

        // Add high pass transient
        const noiseNode = audioCtxRef.current.createOscillator();
        noiseNode.type = "triangle";
        noiseNode.frequency.setValueAtTime(freq * 3, t);
        const noiseGain = audioCtxRef.current.createGain();
        noiseGain.gain.setValueAtTime(0.03, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        noiseNode.connect(noiseGain);
        noiseGain.connect(gainNode);
        noiseNode.start(t);
        noiseNode.stop(t + 0.05);

        // Envelope
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(isChord ? 0.07 : 0.15, t + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      }

      osc.start(t);
      osc.stop(t + duration);
    };

    // Main loop scheduler
    const scheduleNextNotes = () => {
      const now = ctx.currentTime;
      const lookahead = 0.1; // schedule 100ms in advance
      const schedTime = now + lookahead;

      // Every 8 steps is a chord change (4 beats)
      const chordIndex = Math.floor(stepCount / 8) % chords.length;
      const currentChord = chords[chordIndex];

      // 1. Play chord root on beat 1 (step 0 and 8 etc)
      if (stepCount % 8 === 0) {
        currentChord.forEach((freq) => {
          playSynth(freq, schedTime, 1.8, true);
        });
      }

      // 2. Play melody on 8th notes (arpeggiate or random note from scale)
      // High probability of note on major steps
      if (stepCount % 2 === 0 || Math.random() > 0.4) {
        // Pick a note from the scale that fits the chord
        const noteIndex = (stepCount * 2 + Math.floor(Math.random() * 2)) % notes.length;
        const baseFreq = notes[noteIndex];
        // Play an octave higher for melody
        playSynth(baseFreq * 2, schedTime, 0.4, false);
      }

      stepCount++;
    };

    // Fire scheduler immediately, then loop
    scheduleNextNotes();
    loopIntervalRef.current = setInterval(scheduleNextNotes, intervalMs);
  };

  const stopJingle = () => {
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
    if (isPlaying) {
      stopJingle();
    } else {
      startJingle();
    }
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

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-lg pb-32">
      <div className="solar-flare"></div>

      {/* Header with Visual Poster */}
      <div className="text-center relative z-10 mt-4">
        <div className="mb-md flex justify-center">
          <div className="w-full max-w-4xl h-[350px] md:h-[400px] rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(62,102,65,0.06)] relative border border-outline-variant/30">
            {/* The Stylized Poster Image */}
            <img
              alt="Brand Banner Visual"
              className="w-full h-full object-cover object-[center_60%] saturate-[0.85]"
              src={draft?.rawImage}
            />
            {/* Tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-black/10"></div>
          </div>
        </div>
        <h1 className="font-headline text-3xl md:text-5xl text-on-background mb-3 mt-4">
          The Artisan Revolution is Here!
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto px-4">
          Your digital brand identity is complete and synced to the local sandbox. Meet **{brandVars?.brandName}**.
        </p>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter relative z-10 mt-8">
        {/* Card A: Storefront Visual */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300">
          <div className="h-44 relative overflow-hidden bg-surface-container flex items-center justify-center border-b border-outline-variant/20">
            <img
              alt="E-Commerce Mockup"
              className="w-full h-full object-cover mix-blend-multiply"
              src={draft?.rawImage}
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
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300">
          <div
            className="h-44 flex items-center justify-center bg-surface-container border-b border-outline-variant/20 p-6 overflow-hidden"
            style={{ color: brandVars?.colors.primary }}
          >
            {brandVars?.logoImage ? (
              <img
                src={brandVars.logoImage}
                alt="Brand Logo Mark"
                className="w-24 h-24 rounded-full object-cover shadow-sm border border-outline-variant/50 bg-surface"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border border-outline-variant/50 flex items-center justify-center bg-surface shadow-sm p-4"
                dangerouslySetInnerHTML={{ __html: brandVars?.logoSvg || "" }}
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
            <div className="flex gap-2">
              <button
                onClick={downloadLogo}
                className="flex-1 flex items-center justify-center gap-1.5 border border-primary text-primary hover:bg-primary/5 font-label text-xs py-2 px-1.5 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                {brandVars?.logoImage ? "Download Logo" : "SVG Vector"}
              </button>
            </div>
          </div>
        </div>

        {/* Card C: Social Campaign Banner */}
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300">
          <div className="h-44 relative overflow-hidden border-b border-outline-variant/20 flex items-center justify-center">
            {brandVars?.bannerImage ? (
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
                  backgroundColor: `${brandVars?.colors.secondary}15`,
                  color: brandVars?.colors.primary,
                }}
              >
                <p className="font-headline text-xl tracking-tight leading-snug">
                  &ldquo;{brandVars?.adBannerCopy}&rdquo;
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
              {brandVars?.bannerImage && (
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
        <div className="glass-card rounded-[24px] overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 duration-300">
          <div className="h-44 bg-surface-container flex flex-col items-center justify-center gap-4 border-b border-outline-variant/20 px-6">
            {/* Visualizer bars */}
            <div className="flex items-end gap-1.5 h-16">
              {audioBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-primary transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            {/* Controls */}
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
              Theme: {brandVars?.audioTheme.mood} &bull; {brandVars?.audioTheme.instrument} pluck &bull; {brandVars?.audioTheme.tempo} BPM &bull; {brandVars?.audioTheme.scale} scale
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
    </div>
  );
}

export default function BrandPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-on-surface-variant font-medium">Loading...</p>
        </div>
      }>
        <BrandContent />
      </Suspense>
    </DashboardLayout>
  );
}
