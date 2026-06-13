"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

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
}

interface Draft {
  id: string;
  rawImage: string;
  brandVariables?: BrandVariables;
  chatHistory: ChatMessage[];
}

function CopilotContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeStatus, setFinalizeStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
          setDraft(data);
          setMessages(data.chatHistory || []);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [draftId, router]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !draftId || isSending) return;

    setIsSending(true);
    setInputValue("");

    // Optimistically update the UI with user's message
    const userMsg: ChatMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId, message: textToSend }),
      });

      if (res.ok) {
        const updatedDraft = (await res.json()) as Draft;
        setDraft(updatedDraft);
        setMessages(updatedDraft.chatHistory || []);
      } else {
        console.error("Failed to send message to co-pilot");
      }
    } catch (error) {
      console.error("Error chatting with co-pilot:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputValue);
    }
  };

  const handleLockInAndNext = async () => {
    if (!draftId) return;
    setIsFinalizing(true);
    setFinalizeStatus("Instructing Imagen 3 design engine...");

    try {
      // 1. Call finalize route to run Imagen logo & banner generation
      const res = await fetch("/api/gemini/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId }),
      });

      if (res.ok) {
        setFinalizeStatus("Syncing brand assets to the hub...");
        router.push(`/brand?draftId=${draftId}`);
      } else {
        throw new Error("Finalize API failed");
      }
    } catch (error) {
      console.error("Error finalizing brand assets:", error);
      alert("Error generating brand assets. Falling back to the asset hub.");
      router.push(`/brand?draftId=${draftId}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Entering Design Sandbox...</p>
      </div>
    );
  }

  if (isFinalizing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] h-[calc(100vh-8rem)] bg-surface-container-low rounded-[24px] border border-outline-variant/30 shadow-sm">
        <div className="w-20 h-20 rounded-full border-4 border-primary border-t-secondary animate-spin flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-primary text-3xl">
            spa
          </span>
        </div>
        <h3 className="font-headline text-2xl text-primary mt-6 animate-pulse">
          {finalizeStatus}
        </h3>
        <p className="text-on-surface-variant text-sm mt-2 max-w-sm text-center px-4 leading-relaxed">
          Using Google Imagen 3 to paint premium logo marks and social campaign banners. This will take a few seconds...
        </p>
      </div>
    );
  }

  const brandVars = draft?.brandVariables;

  // Preset prompts chips
  const actionChips = [
    { text: "Keep it raw and earthy", icon: "texture" },
    { text: "Give it a premium studio polish", icon: "auto_fix_high" },
    { text: "Make it look modern & minimal", icon: "filter_hdr" },
    { text: "Give it a luxury boutique vibe", icon: "workspace_premium" },
  ];

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-0 overflow-hidden relative border border-outline-variant/30 rounded-[24px] bg-surface-container-lowest shadow-sm">
      {/* Left Column: Canvas Preview */}
      <section className="w-full md:w-1/2 h-1/2 md:h-full p-6 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-outline-variant/30 bg-surface-container-low overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-grow w-full max-w-md my-auto">
          {/* Main Visual Frame */}
          <div className="relative w-full aspect-square bg-surface-container-highest rounded-[24px] shadow-[0_8px_30px_rgba(62,102,65,0.06)] overflow-hidden border border-outline-variant/40 group">
            {/* The Raw Craft Image */}
            <img
              alt="Raw Craft Canvas"
              className="w-full h-full object-cover transition-all duration-300"
              src={draft?.rawImage}
            />

            {/* Floating Brand variables overlay box */}
            {brandVars && (
              <div
                className="absolute bottom-4 left-4 right-4 p-4 rounded-xl shadow-md border animate-fade-in flex items-center gap-3 backdrop-blur-md"
                style={{
                  backgroundColor: `${brandVars.colors.background}cc`,
                  borderColor: `${brandVars.colors.primary}33`,
                  color: brandVars.colors.primary,
                }}
              >
                {/* SVG Logo mark preview */}
                <div
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center p-1 border rounded-lg bg-white/50"
                  style={{ borderColor: `${brandVars.colors.primary}33` }}
                  dangerouslySetInnerHTML={{ __html: brandVars.logoSvg }}
                />
                <div className="flex-grow min-w-0">
                  <h4 className="font-headline text-md truncate leading-tight">
                    {brandVars.brandName}
                  </h4>
                  <p className="text-[11px] font-mono opacity-85 truncate mt-0.5">
                    {brandVars.tagline}
                  </p>
                  {/* Swatches */}
                  <div className="flex gap-1.5 mt-1">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: brandVars.colors.primary }}
                      title={`Primary: ${brandVars.colors.primary}`}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: brandVars.colors.secondary }}
                      title={`Secondary: ${brandVars.colors.secondary}`}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: brandVars.colors.background }}
                      title={`Background: ${brandVars.colors.background}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center px-2">
            <h2 className="font-headline text-xl md:text-2xl text-primary mb-1">
              Active Workspace
            </h2>
            <p className="text-on-surface-variant text-xs max-w-sm mx-auto leading-relaxed">
              Dials and commands feed directly into Gemini to adjust colors, logo geometry, and sonic scales in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Right Column: AI Chat Stream */}
      <section className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col relative bg-surface">
        {/* Chat History Header */}
        <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <span className="font-label text-label-md font-bold text-on-surface">
              Co-Pilot Feedback Loop
            </span>
          </div>
          <button
            onClick={handleLockInAndNext}
            className="bg-primary text-on-primary font-label text-xs py-2 px-4 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Lock &amp; Generate Assets
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
          {messages.map((msg, idx) => {
            const isModel = msg.role === "model";
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 max-w-[85%] ${
                  isModel ? "self-start" : "self-end flex-row-reverse"
                }`}
              >
                {isModel ? (
                  <div className="w-8 h-8 rounded-full bg-tertiary flex-shrink-0 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-on-tertiary text-lg">
                      smart_toy
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm text-on-primary text-sm font-bold">
                    U
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl shadow-[0_4px_16px_rgba(62,102,65,0.04)] font-body text-body-md whitespace-pre-line ${
                    isModel
                      ? "bg-tertiary text-on-tertiary rounded-tl-none"
                      : "bg-surface-container-high text-on-surface rounded-tr-none border border-outline-variant/30"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex items-start gap-3 self-start max-w-[85%] animate-pulse">
              <div className="w-8 h-8 rounded-full bg-tertiary flex-shrink-0 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-on-tertiary text-lg animate-spin">
                  spa
                </span>
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-tertiary text-on-tertiary shadow-sm font-body text-sm">
                Gemini Co-Pilot is refining your brand variables...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-outline-variant/10 bg-surface-container-lowest flex-shrink-0 overflow-x-auto">
          {actionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.text)}
              disabled={isSending}
              className="bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high hover:border-primary text-on-surface font-label text-[12px] py-1.5 px-3.5 rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm text-tertiary">
                {chip.icon}
              </span>
              {chip.text}
            </button>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface flex-shrink-0">
          <div className="relative max-w-2xl mx-auto flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body text-body-md rounded-full py-3.5 pl-6 pr-14 shadow-[0_2px_8px_rgba(62,102,65,0.03)] transition-all outline-none"
              placeholder="Describe adjustments (e.g. 'change background to warm beige' or 'make brand name Aura Clay')..."
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isSending || !inputValue.trim()}
              className="absolute right-2 bg-primary hover:bg-primary-container text-on-primary p-2 rounded-full transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              title="Send Command"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-on-surface-variant font-medium">Loading...</p>
        </div>
      }>
        <CopilotContent />
      </Suspense>
    </DashboardLayout>
  );
}
