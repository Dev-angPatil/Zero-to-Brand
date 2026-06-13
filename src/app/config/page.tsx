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
  };
}

function ConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<Draft | null>(null);
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
            setEarthyVsSunDrenched(
              data.config.aestheticDials?.earthyVsSunDrenched ?? 50
            );
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

  // Generate a dynamic description of the vibe based on dials
  const getVibeEstimate = () => {
    let style = "";
    let scene = "";

    if (rusticVsLuxury < 35) style = "Rustic & Raw";
    else if (rusticVsLuxury > 65) style = "Ultra Luxury & Polished";
    else style = "Earthy Modern Fusion";

    if (earthyVsSunDrenched < 35) scene = "deep forest workshop";
    else if (earthyVsSunDrenched > 65) scene = "sun-drenched studio";
    else scene = "warm ambient indoor setting";

    return `${style} aesthetics, placed in a ${scene}—perfect for sustainable crafts.`;
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

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-lg pb-32">
      {/* Progress Tracker */}
      <header className="flex flex-col gap-sm items-center w-full max-w-2xl mx-auto text-center mt-4">
        <div className="flex items-center gap-2 w-full justify-center text-outline">
          <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm">
            1
          </span>
          <div className="h-1 w-16 bg-primary-container rounded-full"></div>
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">
            2
          </span>
          <div className="h-1 w-16 bg-surface-container-high rounded-full"></div>
          <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm">
            3
          </span>
          <div className="h-1 w-16 bg-surface-container-high rounded-full"></div>
          <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm">
            4
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary mt-2">
          Set Your Vibe
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-md">
          Orchestrate the mood and marketing destinations for your upcoming brand campaign.
        </p>
      </header>

      {/* Main Configuration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-start mt-6">
        {/* Left Column: Destinations */}
        <section className="flex flex-col gap-md">
          <h2 className="font-headline text-2xl text-primary">Destinations</h2>
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
                  <div className="p-6 rounded-[24px] border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:border-primary-container peer-checked:text-on-primary-container text-on-surface transition-all duration-300 organic-shadow flex flex-col items-center gap-3 text-center hover:bg-surface-container">
                    <span
                      className="material-symbols-outlined text-4xl"
                      style={{
                        fontVariationSettings: `'FILL' ${isChecked ? 1 : 0}`,
                      }}
                    >
                      {opt.icon}
                    </span>
                    <span className="font-label text-label-md">{opt.name}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Right Column: Vibe Sliders */}
        <section className="flex flex-col gap-md bg-surface-container rounded-[24px] p-6 lg:p-8 organic-shadow border border-outline-variant/30">
          <h2 className="font-headline text-2xl text-primary mb-2">
            Aesthetic Dials
          </h2>

          {/* Slider 1 */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between font-label text-label-md text-on-surface-variant font-semibold">
              <span>Rustic &amp; Raw</span>
              <span>Ultra Luxury</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rusticVsLuxury}
              onChange={(e) => setRusticVsLuxury(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="w-full h-px bg-outline-variant/30 my-2"></div>

          {/* Slider 2 */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between font-label text-label-md text-on-surface-variant font-semibold">
              <span>Earthy Workshop</span>
              <span>Sun-Drenched Studio</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={earthyVsSunDrenched}
              onChange={(e) => setEarthyVsSunDrenched(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Vibe Preview Card */}
          <div className="mt-6 p-4 rounded-[16px] bg-surface-container-low border border-outline-variant/30 flex items-center gap-4 animate-fade-in">
            <span
              className="material-symbols-outlined text-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <div>
              <p className="font-label text-label-md text-on-surface font-bold">
                Current Vibe Estimate
              </p>
              <p className="text-on-surface-variant text-sm mt-0.5">
                {getVibeEstimate()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Campaign Visual Poster (Displaying uploaded craft photo in a stylized frame) */}
      <section className="w-full mt-6">
        <div className="rounded-[24px] overflow-hidden organic-shadow border border-outline-variant/30 relative h-[400px] md:h-[500px] bg-surface-container flex items-center justify-center">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 filter saturate-[0.8]"
            style={{
              backgroundImage: `url(${draft?.rawImage})`,
              filter: `saturate(${1.0 - rusticVsLuxury / 150}) contrast(${0.95 + earthyVsSunDrenched / 500})`,
            }}
          ></div>
          {/* Overlay to give soft studio light */}
          <div
            className="absolute inset-0 z-10 transition-colors duration-500"
            style={{
              background: `radial-gradient(circle, transparent 20%, rgba(${
                rusticVsLuxury > 50 ? "40, 20, 0" : "38, 78, 43"
              }, 0.3) 100%)`,
            }}
          ></div>
          <div className="relative z-20 text-center text-white px-6 py-4 bg-black/30 backdrop-blur-sm rounded-[24px] max-w-lg mx-4 border border-white/10">
            <h4 className="font-headline text-2xl tracking-wider">Campaign Canvas</h4>
            <p className="text-xs font-mono mt-1 opacity-80 uppercase tracking-widest">
              Live preview reflecting dials &bull; {rusticVsLuxury}% Luxury &bull; {earthyVsSunDrenched}% Sun-Drenched
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Action Dock */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-low border-t border-outline-variant/30 p-4 z-50 shadow-lg">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 px-margin-desktop">
          <button
            onClick={() => router.push(`/?draftId=${draftId}`)}
            className="text-on-surface-variant hover:text-primary transition-colors font-label text-label-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Studio
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={isSaving}
            className="w-full sm:w-auto bg-primary text-on-primary font-label text-label-md px-8 py-4 rounded-[16px] hover:bg-primary-container hover:text-on-primary-container hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Lock in Aesthetics & Generate"}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
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
