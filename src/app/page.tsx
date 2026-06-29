"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Brand {
  id: string;
  createdAt: string;
  status: string;
  rawImage: string;
  brandVariables?: {
    brandName: string;
    tagline: string;
    logoSvg: string;
    logoImage?: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
    };
  };
}

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraftId = searchParams.get("draftId");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  // 0 = Welcome/Selector (skipped if brands.length === 0), 1 = Brand Info, 2 = Vibe & Style, 3 = Upload
  const [wizardStep, setWizardStep] = useState(0);
  const [userBrandName, setUserBrandName] = useState("");
  const [userProductType, setUserProductType] = useState("");
  const [userStyle, setUserStyle] = useState("Solarpunk");
  const [rusticVsLuxury, setRusticVsLuxury] = useState(30);
  const [earthyVsSunDrenched, setEarthyVsSunDrenched] = useState(75);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        const completedBrands = data.filter((b: Brand) => b.status === "completed");
        setBrands(completedBrands);
        if (completedBrands.length === 0) {
          setWizardStep(1);
        }
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const activeId = queryDraftId || localStorage.getItem("activeBrandId");
    if (activeId && !queryDraftId) {
      fetch(`/api/brands?id=${activeId}`).then((res) => {
        if (res.ok) {
          router.push(`/brand?draftId=${activeId}`);
        } else {
          localStorage.removeItem("activeBrandId");
          fetchBrands();
        }
      });
    } else {
      fetchBrands();
    }
  }, [queryDraftId, router]);

  const handleSelectBrand = (brandId: string) => {
    localStorage.setItem("activeBrandId", brandId);
    router.push(`/brand?draftId=${brandId}`);
  };

  const handleStyleSelect = (style: string) => {
    setUserStyle(style);
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsCreating(true);
    setCreationProgress("Reading raw craft materials...");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        if (!base64Image) throw new Error("Failed to read file");

        setCreationProgress("Drafting brand sandbox...");
        // 1. Create a brand draft in local database
        const createRes = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawImage: base64Image }),
        });

        if (!createRes.ok) throw new Error("Failed to create brand draft");
        const brand = await createRes.json();

        // 2. Save user-defined configuration details
        setCreationProgress("Locking brand aesthetics...");
        const config = {
          destinations: ["Instagram Shop", "Local Pop-Up Page"],
          aestheticDials: {
            rusticVsLuxury,
            earthyVsSunDrenched,
          },
          ownerName: userBrandName,
          targetAudience: "Eco-conscious Collectors",
          designStyle: userStyle,
        };

        const configRes = await fetch(`/api/brands?id=${brand.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });

        if (!configRes.ok) throw new Error("Failed to configure brand aesthetics");

        // 3. Run Gemini ingest analysis (respects config overrides)
        setCreationProgress("Gemini is formulating brand DNA...");
        const ingestRes = await fetch("/api/gemini/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: brand.id }),
        });

        if (!ingestRes.ok) throw new Error("Failed to analyze initial image");

        // 4. Finalize logo and banners with Imagen 3
        setCreationProgress("Imagen 3 is generating premium logos & banner...");
        const finalizeRes = await fetch("/api/gemini/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: brand.id }),
        });

        if (!finalizeRes.ok) throw new Error("Failed to finalize brand assets");

        setCreationProgress("Launching your brand workspace...");
        localStorage.setItem("activeBrandId", brand.id);
        router.push(`/brand?draftId=${brand.id}`);
      };

      reader.onerror = () => {
        throw new Error("File reading error");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Creation error:", error);
      alert("Error initializing brand. Please try again.");
      setIsCreating(false);
    }
  };

  const styleOptions = [
    { name: "Solarpunk", desc: "Eco-tech, foliage, warm green base", icon: "spa" },
    { name: "Minimalist", desc: "Beige, clean, gallery styling", icon: "select_all" },
    { name: "Cyberpunk", desc: "Future neon, dark gloss, pink/cyan", icon: "bolt" },
    { name: "Vintage", desc: "Warm wood grains, heritage warmth", icon: "history" },
    { name: "Cozy", desc: "Cinematic flares, sun beams, soft wool", icon: "wb_sunny" },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container font-body overflow-y-auto relative">
      {/* Background Graphic Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 mix-blend-multiply pointer-events-none z-0"></div>
      <div className="solar-flare"></div>

      {/* Header */}
      <header className="flex-shrink-0 w-full flex justify-between items-center px-6 md:px-16 h-24 z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-4xl font-bold">
            spa
          </span>
          <span className="font-headline text-2xl text-primary tracking-wide">
            Zero to Brand
          </span>
        </div>
        <div className="text-sm font-mono text-outline">v1.0</div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 z-10 max-w-6xl mx-auto w-full">
        {isCreating ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 bg-surface-container-low rounded-[32px] border border-outline-variant/30 shadow-lg animate-fade-in">
            <div className="w-20 h-20 rounded-full border-4 border-primary border-t-secondary animate-spin flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary text-3xl">
                spa
              </span>
            </div>
            <h3 className="font-headline text-2xl text-primary animate-pulse font-bold">
              {creationProgress}
            </h3>
            <p className="text-on-surface-variant text-sm">
              Analyzing raw textures, crafting custom copywriting, and painting your brand assets using Gemini 2.5 Flash and Imagen 3.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-10">
            {/* Title Section */}
            <div className="text-center max-w-xl mx-auto">
              <h1 className="font-headline text-4xl md:text-5xl text-on-surface mb-3 leading-tight font-bold">
                Your Brand, Handcrafted
              </h1>
              <p className="text-on-surface-variant text-body-md">
                Bootstrap a custom, professional digital brand identity from a single photo of your craft.
              </p>
            </div>

            {/* Step 0: Selector Workspace / Start Wizard */}
            {wizardStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative">
                {/* Brand Selector */}
                <section className="glass-card rounded-[32px] p-6 md:p-8 flex flex-col gap-6 shadow-md transition-all duration-300">
                  <div className="border-b border-outline-variant/30 pb-4">
                    <h2 className="font-headline text-2xl text-primary flex items-center gap-2 font-bold">
                      <span className="material-symbols-outlined text-secondary">collections_bookmark</span>
                      Active Workspaces
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Select a brand to enter its Creative Studio and catalog products.
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-12">
                      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <p className="text-xs text-on-surface-variant mt-2">Syncing registries...</p>
                    </div>
                  ) : (
                    <div className="flex-grow overflow-y-auto max-h-[350px] flex flex-col gap-4 pr-1 scrollbar-thin">
                      {brands.map((brand) => {
                        const vars = brand.brandVariables!;
                        return (
                          <div
                            key={brand.id}
                            onClick={() => handleSelectBrand(brand.id)}
                            className="p-4 bg-white/60 hover:bg-white/95 rounded-[24px] border border-outline-variant/30 hover:border-primary hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm cursor-pointer flex items-center gap-4 group"
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/50 shadow-sm">
                              {vars.logoImage ? (
                                <img
                                  src={vars.logoImage}
                                  alt={vars.brandName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 p-1"
                                  style={{ color: vars.colors.primary }}
                                  dangerouslySetInnerHTML={{ __html: vars.logoSvg }}
                                />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors truncate font-bold">
                                {vars.brandName}
                              </h3>
                              <p className="text-xs text-on-surface-variant truncate">
                                {vars.tagline}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">
                              arrow_forward
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Launch new wizard card */}
                <section className="glass-card rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-md transition-all duration-300 bg-white/40">
                  <div className="flex flex-col gap-6">
                    <div className="border-b border-outline-variant/30 pb-4">
                      <h2 className="font-headline text-2xl text-primary flex items-center gap-2 font-bold">
                        <span className="material-symbols-outlined text-secondary">auto_fix_high</span>
                        Launch New Brand
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Configure brand details, styles, and upload craft photos to initialize aesthetics.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 py-4 text-center">
                      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto border border-outline-variant/40 shadow-sm">
                        <span className="material-symbols-outlined text-[36px] text-secondary">
                          spa
                        </span>
                      </div>
                      <h3 className="font-headline text-xl text-on-surface font-bold">Start Creator Onboarding</h3>
                      <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                        Customize your brand settings and load signature craft photos. Let Gemini co-pilot your digital storefront design.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="w-full py-3.5 bg-primary text-on-primary font-label text-label-md rounded-xl hover:bg-primary-container shadow flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    Start Onboarding
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </section>
              </div>
            )}

            {/* Step 1: Brand Info */}
            {wizardStep === 1 && (
              <section className="glass-card rounded-[32px] p-6 md:p-8 max-w-2xl mx-auto w-full shadow-md flex flex-col gap-6 animate-fade-in bg-white/40">
                <div className="border-b border-outline-variant/30 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-outline">Step 1 of 3</span>
                  <h2 className="font-headline text-2xl text-primary font-bold mt-1">Tell us about your brand</h2>
                  <p className="text-xs text-on-surface-variant mt-1">Define the basics of your artisan creator identity.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-headline text-sm font-semibold text-primary" htmlFor="brandName">Brand / Shop Name</label>
                    <input
                      id="brandName"
                      type="text"
                      placeholder="e.g. Varnam Crafted, Clay & Hearth"
                      value={userBrandName}
                      onChange={(e) => setUserBrandName(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-headline text-sm font-semibold text-primary" htmlFor="productType">What do you craft/sell?</label>
                    <input
                      id="productType"
                      type="text"
                      placeholder="e.g. Hand-painted ceramic pots, Macrame wall hangings"
                      value={userProductType}
                      onChange={(e) => setUserProductType(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm rounded-xl p-3 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  {brands.length > 0 && (
                    <button
                      onClick={() => setWizardStep(0)}
                      className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-label text-xs font-bold transition-all cursor-pointer"
                    >
                      Back to workspaces
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!userBrandName || !userProductType) {
                        alert("Please fill in both fields to continue!");
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="flex-1 py-3 bg-primary text-on-primary hover:opacity-95 rounded-xl font-label text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Next Step
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}

            {/* Step 2: Vibe & Style Selection */}
            {wizardStep === 2 && (
              <section className="glass-card rounded-[32px] p-6 md:p-8 max-w-2xl mx-auto w-full shadow-md flex flex-col gap-6 animate-fade-in bg-white/40">
                <div className="border-b border-outline-variant/30 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-outline">Step 2 of 3</span>
                  <h2 className="font-headline text-2xl text-primary font-bold mt-1">Select your brand style guide</h2>
                  <p className="text-xs text-on-surface-variant mt-1">Aesthetic presets and dials to shape your visual storefront.</p>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Style Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {styleOptions.map((opt) => (
                      <div
                        key={opt.name}
                        onClick={() => handleStyleSelect(opt.name)}
                        className={`p-4 bg-white/60 hover:bg-white/95 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 shadow-sm ${
                          userStyle === opt.name ? "border-primary ring-1 ring-primary" : "border-outline-variant/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-lg">{opt.icon}</span>
                          <span className="font-headline text-sm font-bold text-on-surface">{opt.name}</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Dials sliders */}
                  <div className="flex flex-col gap-4 border-t border-outline-variant/20 pt-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-headline font-bold text-primary">
                        <span>Rustic &amp; Raw ({100 - rusticVsLuxury}%)</span>
                        <span>Luxury &amp; Polished ({rusticVsLuxury}%)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rusticVsLuxury}
                        onChange={(e) => setRusticVsLuxury(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-surface-container rounded-lg outline-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-headline font-bold text-primary">
                        <span>Earthy &amp; Mellow ({100 - earthyVsSunDrenched}%)</span>
                        <span>Sun-Drenched &amp; Vibrant ({earthyVsSunDrenched}%)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={earthyVsSunDrenched}
                        onChange={(e) => setEarthyVsSunDrenched(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-surface-container rounded-lg outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-4 border-t border-outline-variant/10 pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-label text-xs font-bold transition-all cursor-pointer"
                  >
                    Back to Info
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="flex-1 py-3 bg-primary text-on-primary hover:opacity-95 rounded-xl font-label text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Next Step
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}

            {/* Step 3: Photo Upload */}
            {wizardStep === 3 && (
              <section className="glass-card rounded-[32px] p-6 md:p-8 max-w-2xl mx-auto w-full shadow-md flex flex-col gap-6 animate-fade-in bg-white/40">
                <div className="border-b border-outline-variant/30 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-outline">Step 3 of 3</span>
                  <h2 className="font-headline text-2xl text-primary font-bold mt-1">Upload signature craft photo</h2>
                  <p className="text-xs text-on-surface-variant mt-1">We will analyze materials/textures and generate your complete brand workspace.</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className="dashed-terracotta rounded-[24px] bg-white/40 hover:bg-white/80 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-sm aspect-video"
                >
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 border border-outline-variant/40 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[36px] text-secondary">
                      cloud_upload
                    </span>
                  </div>
                  <h3 className="font-headline text-xl text-on-surface mb-1 font-bold">
                    Upload Signature Craft
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                    Select a photo of your signature piece (e.g. pottery, wood, weaving). Gemini will parse details to finalize your brand assets.
                  </p>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 bg-primary text-on-primary font-label text-xs rounded-full shadow hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    Browse Local File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex gap-4 mt-4 border-t border-outline-variant/10 pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-label text-xs font-bold transition-all cursor-pointer"
                  >
                    Back to Style
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 w-full py-6 text-center text-xs text-outline border-t border-outline-variant/20 z-10">
        &copy; {new Date().getFullYear()} Zero to Brand. Powered by Google Gemini.
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Initializing Gateway...</p>
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
