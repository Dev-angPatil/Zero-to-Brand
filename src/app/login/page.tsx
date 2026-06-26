"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        // Only show completed brands for login selection
        setBrands(data.filter((b: Brand) => b.status === "completed"));
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear any active session when entering login
    localStorage.removeItem("activeBrandId");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBrands();
  }, []);

  const handleSelectBrand = (brandId: string) => {
    localStorage.setItem("activeBrandId", brandId);
    router.push(`/?draftId=${brandId}`);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
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
        setCreationProgress("Gemini is formulating brand DNA...");

        // 2. Run Gemini ingest analysis
        const ingestRes = await fetch("/api/gemini/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: brand.id }),
        });

        if (!ingestRes.ok) throw new Error("Failed to analyze initial image");

        // Redirect to configuration step of brand creation onboarding
        router.push(`/config?draftId=${brand.id}`);
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
            <h3 className="font-headline text-2xl text-primary animate-pulse">
              {creationProgress}
            </h3>
            <p className="text-on-surface-variant text-sm">
              Analyzing the raw textures, craftsmanship, and materials of your craft to define your new brand identity.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-10">
            {/* Title Section */}
            <div className="text-center max-w-xl mx-auto">
              <h1 className="font-headline text-4xl md:text-5xl text-on-surface mb-3 leading-tight">
                Your Brand, Handcrafted
              </h1>
              <p className="text-on-surface-variant text-body-md">
                Enter your existing artisan workspace or spark a brand new identity from a raw craft photo.
              </p>
            </div>

            {/* Selection/Creation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Column: Brand Selector */}
              <section className="bg-surface-container-low rounded-[32px] border border-outline-variant/30 p-6 flex flex-col gap-6 shadow-sm">
                <div className="border-b border-outline-variant/20 pb-4">
                  <h2 className="font-headline text-2xl text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined">collections_bookmark</span>
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
                ) : brands.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">
                      folder_open
                    </span>
                    <p className="font-semibold text-sm">No configured brands found</p>
                    <p className="text-xs text-outline mt-1 max-w-xs">
                      Start your journey by creating a new brand on the right side.
                    </p>
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto max-h-[350px] flex flex-col gap-4 pr-1">
                    {brands.map((brand) => {
                      const vars = brand.brandVariables!;
                      return (
                        <div
                          key={brand.id}
                          onClick={() => handleSelectBrand(brand.id)}
                          className="p-4 bg-surface rounded-[24px] border border-outline-variant/30 hover:border-primary transition-all duration-300 shadow-sm cursor-pointer flex items-center gap-4 group"
                        >
                          {/* Brand Logo preview */}
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/50">
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
                            <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors truncate">
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

              {/* Right Column: Brand Creator */}
              <section className="bg-surface-container-low rounded-[32px] border border-outline-variant/30 p-6 flex flex-col gap-6 shadow-sm">
                <div className="border-b border-outline-variant/20 pb-4">
                  <h2 className="font-headline text-2xl text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined">auto_fix_high</span>
                    Launch New Brand
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Upload a signature craft image to initialize brand aesthetics.
                  </p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className="flex-grow border-2 border-dashed border-outline hover:border-primary rounded-[24px] bg-surface flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 hover:bg-surface-container"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[36px] text-secondary">
                      cloud_upload
                    </span>
                  </div>
                  <h3 className="font-headline text-xl text-on-surface mb-1">
                    Upload Signature Craft
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                    Select a photo of your pottery, woodwork, weaving, or craft. Gemini will weave your brand identity from it.
                  </p>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 bg-primary text-on-primary font-label text-xs rounded-full shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-all"
                  >
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
              </section>
            </div>
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
