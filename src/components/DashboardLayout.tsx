"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Brand {
  id: string;
  status: string;
  brandVariables?: {
    brandName: string;
    logoSvg: string;
    logoImage?: string;
    colors: {
      primary: string;
    };
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function SidebarLinks({
  activeBrand,
  onboardId,
}: {
  activeBrand: Brand | null;
  onboardId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active step styling
  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-xl font-bold font-label-md text-label-md transition-all duration-200 ease-in-out shadow-sm";
    }
    return "flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container rounded-xl font-label-md text-label-md transition-all duration-200 ease-in-out";
  };

  const handleLogout = () => {
    localStorage.removeItem("activeBrandId");
    router.push("/login");
  };

  // Onboarding vs Workspace links
  const isCompletedBrand = activeBrand && activeBrand.status === "completed";
  const brandId = activeBrand?.id || onboardId;

  if (isCompletedBrand) {
    return (
      <div className="flex-grow flex flex-col justify-between h-full">
        <div className="flex flex-col gap-2">
          <Link href={`/brand?draftId=${brandId}`} className={getLinkClass("/brand")}>
            <span className="material-symbols-outlined">dashboard</span>
            Brand Workspace
          </Link>

          <Link href={`/config?draftId=${brandId}`} className={getLinkClass("/config")}>
            <span className="material-symbols-outlined">settings_suggest</span>
            Vibe Settings
          </Link>

          <Link href={`/copilot?draftId=${brandId}`} className={getLinkClass("/copilot")}>
            <span className="material-symbols-outlined">smart_toy</span>
            Co-Pilot Chat
          </Link>

          <a
            href={`/store/${brandId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container rounded-xl font-label-md text-label-md transition-all"
          >
            <span className="material-symbols-outlined">storefront</span>
            View Storefront
            <span className="material-symbols-outlined text-xs ml-auto">open_in_new</span>
          </a>
        </div>

        <div className="pt-4 border-t border-outline-variant/30 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/5 rounded-xl font-label-md text-label-md transition-all text-left cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            Switch Workspace
          </button>
        </div>
      </div>
    );
  }

  // Onboarding flow links (when creating a brand)
  const isLocked = !onboardId;
  const studioLink = onboardId ? `/?draftId=${onboardId}` : "/";
  const configLink = onboardId ? `/config?draftId=${onboardId}` : "#";
  const copilotLink = onboardId ? `/copilot?draftId=${onboardId}` : "#";
  const brandLink = onboardId ? `/brand?draftId=${onboardId}` : "#";

  return (
    <div className="flex-grow flex flex-col justify-between h-full">
      <div className="flex flex-col gap-2">
        <Link href={studioLink} className={getLinkClass("/", true)}>
          <span className="material-symbols-outlined">dashboard</span>
          Creative Studio
        </Link>

        <Link
          href={configLink}
          className={`${getLinkClass("/config")} ${isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          onClick={(e) => isLocked && e.preventDefault()}
        >
          <span className="material-symbols-outlined">
            {isLocked ? "lock" : "auto_awesome"}
          </span>
          Campaign Config
        </Link>

        <Link
          href={copilotLink}
          className={`${getLinkClass("/copilot")} ${isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          onClick={(e) => isLocked && e.preventDefault()}
        >
          <span className="material-symbols-outlined">
            {isLocked ? "lock" : "chat_bubble"}
          </span>
          Design Co-Pilot
        </Link>

        <Link
          href={brandLink}
          className={`${getLinkClass("/brand")} ${isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          onClick={(e) => isLocked && e.preventDefault()}
        >
          <span className="material-symbols-outlined">
            {isLocked ? "lock" : "collections_bookmark"}
          </span>
          Brand Hub
        </Link>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container rounded-xl font-label-md text-label-md transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Login
        </button>
      </div>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const onboardId = searchParams.get("draftId");
  const [isReady, setIsReady] = useState(pathname === "/" || pathname === "/login");

  useEffect(() => {
    const activeId = localStorage.getItem("activeBrandId");
    const queryDraftId = searchParams.get("draftId");

    // If we are on landing or login page, just show it
    if (pathname === "/" || pathname === "/login") {
      return;
    }

    const loadBrandContext = async () => {
      setIsReady(false);
      const targetId = activeId || queryDraftId;

      if (!targetId) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`/api/brands?id=${targetId}`);
        if (res.ok) {
          const brandData = (await res.json()) as Brand;
          setActiveBrand(brandData);

          // If logged in brand ID doesn't match local storage, sync it
          if (brandData.status === "completed" && activeId !== brandData.id) {
            localStorage.setItem("activeBrandId", brandData.id);
          }
        } else {
          // If brand not found, clear and redirect
          localStorage.removeItem("activeBrandId");
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading brand layout context:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadBrandContext();
  }, [searchParams, pathname, router]);

  if (!isReady && pathname !== "/" && pathname !== "/login") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium font-sans">Connecting Brand Vault...</p>
      </div>
    );
  }

  const vars = activeBrand?.brandVariables;
  const isCompleted = activeBrand?.status === "completed";

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container font-body overflow-hidden">
      {/* Top Navigation Header */}
      <header className="flex-shrink-0 w-full flex justify-between items-center px-4 md:px-16 h-20 bg-surface border-b border-outline-variant/30 shadow-[0_4px_20px_rgba(62,102,65,0.04)] z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">
              spa
            </span>
            <span className="font-headline text-xl text-primary tracking-wide">
              Zero to Brand
            </span>
          </Link>
          {isCompleted && vars && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/30 ml-4">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-surface flex items-center justify-center border border-outline-variant/50">
                {vars.logoImage ? (
                  <img src={vars.logoImage} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-4 h-4" style={{ color: vars.colors.primary }} dangerouslySetInnerHTML={{ __html: vars.logoSvg }} />
                )}
              </div>
              <span className="font-headline text-xs text-on-surface-variant font-bold">
                {vars.brandName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isCompleted && vars ? (
            <span className="hidden lg:inline-block font-label text-label-md text-on-surface">
              Active: <strong>{vars.brandName}</strong>
            </span>
          ) : (
            <span className="hidden lg:inline-block font-label text-label-md text-on-surface">
              Brand Sandbox Onboarding
            </span>
          )}
          <div className="flex items-center gap-3">
            <button className="text-primary hover:text-secondary p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-primary hover:text-secondary p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant organic-border ml-2 bg-surface-container flex items-center justify-center font-bold text-primary">
              {vars?.brandName ? vars.brandName[0].toUpperCase() : "D"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* Side Navigation (Desktop Sidebar) */}
        <aside className="hidden lg:flex flex-col p-4 gap-4 w-64 bg-surface-container-low border-r border-outline-variant/30 h-full overflow-y-auto flex-shrink-0">
          <div className="flex-grow mt-8">
            <SidebarLinks activeBrand={activeBrand} onboardId={onboardId} />
          </div>
        </aside>

        {/* Main Content Scroll Area */}
        <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 lg:pb-12 bg-background">
          {children}
        </main>
      </div>

      {/* Footer Status Status Bar */}
      <footer className="flex-shrink-0 w-full bg-surface-container-lowest border-t border-outline-variant/30 px-6 py-2 flex justify-between items-center z-30 hidden lg:flex">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">
            cloud_done
          </span>
          <span>Syncing status: local file database active</span>
        </div>
        <div className="text-xs text-on-surface-variant font-mono">
          Zero to Brand v1.0
        </div>
      </footer>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
