"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface Draft {
  id: string;
  rawImage: string;
  config?: {
    destinations: string[];
    aestheticDials: {
      rusticVsLuxury: number;
      earthyVsSunDrenched: number;
    };
    ownerName?: string;
    targetAudience?: string;
    designStyle?: string;
  };
}

function ConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState(1);
  
  // Onboarding survey answers
  const [ownerName, setOwnerName] = useState("");
  const [creatorStory, setCreatorStory] = useState("");
  const [targetAudience, setTargetAudience] = useState("Eco-conscious Collectors");
  const [designStyle, setDesignStyle] = useState("Solarpunk");
  
  const [destinations, setDestinations] = useState<string[]>([
    "Instagram Shop",
    "Local Pop-Up Page",
  ]);
  const [rusticVsLuxury, setRusticVsLuxury] = useState(30);
  const [earthyVsSunDrenched, setEarthyVsSunDrenched] = useState(75);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing configuration if available
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
          setDraft(data);
          if (data.config) {
            setDestinations(data.config.destinations || []);
            setRusticVsLuxury(data.config.aestheticDials?.rusticVsLuxury ?? 50);
            setEarthyVsSunDrenched(data.config.aestheticDials?.earthyVsSunDrenched ?? 50);
            setOwnerName(data.config.ownerName || "");
            setTargetAudience(data.config.targetAudience || "Eco-conscious Collectors");
            setDesignStyle(data.config.designStyle || "Solarpunk");
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [draftId, router]);

  const toggleDestination = (dest: string) => {
    if (destinations.includes(dest)) {
      setDestinations(destinations.filter((d) => d !== dest));
    } else {
      setDestinations([...destinations, dest]);
    }
  };

  // Adjust sliders automatically based on style selection for premium co-pilot feel
  const handleStyleSelect = (style: string) => {
    setDesignStyle(style);
    if (style === "Minimalist") {
      setRusticVsLuxury(80);
      setEarthyVsSunDrenched(85);
    } else if (style === "Cyberpunk") {
      setRusticVsLuxury(90);
      setEarthyVsSunDrenched(20);
    } else if (style === "Vintage") {
      setRusticVsLuxury(20);
      setEarthyVsSunDrenched(30);
    } else if (style === "Cozy") {
      setRusticVsLuxury(40);
      setEarthyVsSunDrenched(75);
    } else {
      // Solarpunk
      setRusticVsLuxury(30);
      setEarthyVsSunDrenched(80);
    }
  };

  const getVibeEstimate = () => {
    let style = "";
    let scene = "";

    if (rusticVsLuxury < 35) style = "Rustic & Raw";
    else if (rusticVsLuxury > 65) style = "Ultra Luxury & Polished";
    else style = "Earthy Modern Fusion";

    if (earthyVsSunDrenched < 35) scene = "deep forest workshop";
    else if (earthyVsSunDrenched > 65) scene = "sun-drenched studio";
    else scene = "warm ambient indoor setting";

    return `${style} aesthetics, placed in a ${scene}—perfect for ${targetAudience.toLowerCase()}.`;
  };

  const handleSaveAndNext = async () => {
    if (!draftId) return;
    setIsSaving(true);

    try {
      const config = {
        destinations,
        aestheticDials: {
          rusticVsLuxury,
          earthyVsSunDrenched,
        },
        ownerName,
        targetAudience,
        designStyle,
      };

      const res = await fetch(`/api/brands?id=${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (res.ok) {
        router.push(`/copilot?draftId=${draftId}`);
      } else {
        alert("Failed to save configuration.");
      }
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Loading project vibe...</p>
      </div>
    );
  }

  const destinationOptions = [
    { name: "Instagram Shop", icon: "storefront" },
    { name: "Etsy Premium", icon: "loyalty" },
    { name: "Local Pop-Up Page", icon: "location_on" },
    { name: "Global Web Storefront", icon: "language" },
  ];

  const styleOptions = [
    { name: "Solarpunk", desc: "Bright eco-brightness & natural foliage", icon: "spa" },
    { name: "Minimalist", desc: "Sleek, clean, beige gallery styling", icon: "select_all" },
    { name: "Cyberpunk", desc: "Futuristic neon, dark gloss, night lighting", icon: "bolt" },
    { name: "Vintage", desc: "Warm wood grains, heritage, ancestral feel", icon: "history" },
    { name: "Cozy", desc: "Cinematic flares, sun beams, warm textures", icon: "wb_sunny" },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-12 pb-32">
      {/* Progress Tracker */}
      <header className="flex flex-col gap-3 items-center w-full max-w-2xl mx-auto text-center mt-4">
        <div className="flex items-center gap-2 w-full justify-center text-outline">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${step >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            1
          </span>
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 2 ? "bg-primary" : "bg-surface-container-high"}`}></div>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${step >= 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            2
          </span>
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 3 ? "bg-primary" : "bg-surface-container-high"}`}></div>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${step >= 3 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            3
          </span>
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 4 ? "bg-primary" : "bg-surface-container-high"}`}></div>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${step >= 4 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            4
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary mt-2">
          {step === 1 && "Tell Us About Yourself"}
          {step === 2 && "Audience & Destinations"}
          {step === 3 && "Aesthetics & Vibe"}
          {step === 4 && "Review Brand Setup"}
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-md">
          {step === 1 && "Let's capture your story and background as an artisan creator."}
          {step === 2 && "Determine who your target customers are and where you sell."}
          {step === 3 && "Tune the visual dials and select a design system mood."}
          {step === 4 && "Verify your preferences before Gemini paints your design assets."}
        </p>
      </header>

      {/* Main Wizard Step Box */}
      <div className="max-w-3xl mx-auto w-full glass-card rounded-[32px] p-6 md:p-10 shadow-lg mt-6">
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              <label htmlFor="ownerName" className="font-headline text-lg text-primary">Your Name / Creator Alias</label>
              <input
                id="ownerName"
                type="text"
                placeholder="e.g. Master Potter Ang, Clara Croft"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body text-body-md rounded-xl p-4 shadow-sm outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="creatorStory" className="font-headline text-lg text-primary">Your Craft &amp; Heritage Story</label>
              <textarea
                id="creatorStory"
                rows={4}
                placeholder="Briefly describe what you create, the materials you handpick, and your heritage process..."
                value={creatorStory}
                onChange={(e) => setCreatorStory(e.target.value)}
                className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body text-body-md rounded-xl p-4 shadow-sm outline-none resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              <label htmlFor="targetAudience" className="font-headline text-lg text-primary">Who is your Target Audience?</label>
              <select
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body text-body-md rounded-xl p-4 shadow-sm outline-none cursor-pointer"
              >
                <option value="Eco-conscious Collectors">Eco-conscious Collectors</option>
                <option value="Luxury Boutique Buyers">Luxury Boutique Buyers</option>
                <option value="Minimalist Urban Planners">Minimalist Urban Planners</option>
                <option value="Local Heritage Admirers">Local Heritage Admirers</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-headline text-lg text-primary">Destinations</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destinationOptions.map((opt) => {
                  const isChecked = destinations.includes(opt.name);
                  return (
                    <label key={opt.name} className="cursor-pointer relative">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDestination(opt.name)}
                        className="peer sr-only"
                      />
                      <div className="p-4 rounded-[20px] border border-outline-variant bg-surface peer-checked:bg-primary-container peer-checked:border-primary-container peer-checked:text-on-primary-container text-on-surface transition-all duration-300 flex items-center gap-3 hover:bg-surface-container">
                        <span
                          className="material-symbols-outlined text-2xl"
                          style={{
                            fontVariationSettings: `'FILL' ${isChecked ? 1 : 0}`,
                          }}
                        >
                          {opt.icon}
                        </span>
                        <span className="font-label text-sm font-semibold">{opt.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col gap-3">
              <label className="font-headline text-lg text-primary">Preferred Design System</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {styleOptions.map((style) => {
                  const isSelected = designStyle === style.name;
                  return (
                    <div
                      key={style.name}
                      onClick={() => handleStyleSelect(style.name)}
                      className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 flex flex-col gap-1 items-start shadow-sm ${
                        isSelected ? "bg-primary-container border-primary text-on-primary-container" : "bg-surface border-outline-variant/50 hover:bg-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-primary">{style.icon}</span>
                        <span className="font-label text-sm font-bold">{style.name}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-snug">{style.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-outline-variant/30 my-2"></div>

            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <label className="font-headline text-lg text-primary">Aesthetic Dials</label>
                <span className="text-[10px] uppercase font-mono text-secondary-container bg-secondary px-2.5 py-0.5 rounded-full font-bold">Interactive dials</span>
              </div>
              
              <div className="flex flex-col gap-3 p-4 bg-white/40 rounded-2xl border border-outline-variant/30">
                <div className="flex justify-between font-label text-xs text-on-surface-variant font-bold">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">agriculture</span>Rustic &amp; Raw</span>
                  <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">{rusticVsLuxury}%</span>
                  <span className="flex items-center gap-1">Ultra Luxury<span className="material-symbols-outlined text-sm">workspace_premium</span></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rusticVsLuxury}
                  onChange={(e) => setRusticVsLuxury(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 bg-white/40 rounded-2xl border border-outline-variant/30">
                <div className="flex justify-between font-label text-xs text-on-surface-variant font-bold">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">handyman</span>Earthy Workshop</span>
                  <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">{earthyVsSunDrenched}%</span>
                  <span className="flex items-center gap-1">Sun-Drenched Studio<span className="material-symbols-outlined text-sm">wb_sunny</span></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={earthyVsSunDrenched}
                  onChange={(e) => setEarthyVsSunDrenched(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Visual Canvas Frame */}
            <div className="rounded-[24px] overflow-hidden border border-outline-variant/30 relative h-[280px] bg-surface-container flex items-center justify-center">
              <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 filter saturate-[0.8]"
                style={{
                  backgroundImage: `url(${draft?.rawImage})`,
                  filter: `saturate(${1.0 - rusticVsLuxury / 150}) contrast(${0.95 + earthyVsSunDrenched / 500})`,
                }}
              ></div>
              <div className="absolute inset-0 z-10 bg-black/30"></div>
              <div className="relative z-20 text-center text-white px-4 py-3 bg-black/40 backdrop-blur-sm rounded-[16px] max-w-md mx-4 border border-white/10">
                <h4 className="font-headline text-lg tracking-wider">Aesthetic Canvas Preview</h4>
                <p className="text-[10px] font-mono mt-1 opacity-85 uppercase tracking-widest">
                  Style: {designStyle} &bull; {rusticVsLuxury}% Luxury &bull; {earthyVsSunDrenched}% Sun-Drenched
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 gap-4 bg-surface p-5 rounded-2xl border border-outline-variant/20">
              <div>
                <span className="text-[10px] uppercase font-mono text-outline block">Brand Owner</span>
                <span className="font-semibold text-on-surface">{ownerName || "Artisan Creator"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-outline block">Target Audience</span>
                <span className="font-semibold text-on-surface">{targetAudience}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-outline block">Design Preset</span>
                <span className="font-semibold text-on-surface">{designStyle}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-outline block">Vibe Settings</span>
                <span className="font-semibold text-on-surface truncate block">{getVibeEstimate()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons inside step container */}
        <div className="flex justify-between items-center border-t border-outline-variant/20 pt-6 mt-8">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else router.push(`/?draftId=${draftId}`);
            }}
            className="text-on-surface-variant hover:text-primary transition-colors font-label text-sm flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-primary text-on-primary font-label text-sm px-6 py-3 rounded-xl hover:opacity-95 shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Continue
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSaveAndNext}
              disabled={isSaving}
              className="bg-primary text-on-primary font-label text-sm px-8 py-3 rounded-xl hover:opacity-95 shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Lock in Aesthetics & Generate"}
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-on-surface-variant font-medium">Loading...</p>
        </div>
      }>
        <ConfigContent />
      </Suspense>
    </DashboardLayout>
  );
}
