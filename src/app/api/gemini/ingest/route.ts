import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/data/dbClient";
import { analyzeCraftImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    const brand = dbClient.getBrand(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Call Gemini to analyze the image
    const analysis = await analyzeCraftImage(brand.rawImage);

    // Check for user-defined configuration to override defaults
    let brandName = analysis.suggestedBrandName;
    let colors = {
      primary: "#264e2b", // Solarpunk default
      secondary: "#fcd03d",
      background: "#f7faf2",
    };
    let audioTheme: {
      tempo: number;
      scale: "major" | "minor" | "pentatonic";
      instrument: "acoustic" | "warm-synth" | "bell";
      mood: "organic" | "modern" | "luxury";
    } = {
      tempo: 90,
      scale: "pentatonic",
      instrument: "acoustic",
      mood: "organic",
    };
    let style = "Solarpunk";

    if (brand.config) {
      if (brand.config.ownerName) {
        brandName = brand.config.ownerName;
      }
      if (brand.config.designStyle) {
        style = brand.config.designStyle;
        if (style === "Minimalist") {
          colors = { primary: "#1a1a1a", secondary: "#8c7b6c", background: "#faf8f5" };
          audioTheme = { tempo: 100, scale: "major" as const, instrument: "bell" as const, mood: "modern" as const };
        } else if (style === "Cyberpunk") {
          colors = { primary: "#ff007f", secondary: "#00f0ff", background: "#0a0512" };
          audioTheme = { tempo: 120, scale: "minor" as const, instrument: "warm-synth" as const, mood: "modern" as const };
        } else if (style === "Vintage") {
          colors = { primary: "#4e2f1d", secondary: "#b58c56", background: "#f5f0eb" };
          audioTheme = { tempo: 80, scale: "minor" as const, instrument: "acoustic" as const, mood: "luxury" as const };
        } else if (style === "Cozy") {
          colors = { primary: "#a64b2a", secondary: "#d99f59", background: "#faf5f0" };
          audioTheme = { tempo: 85, scale: "pentatonic" as const, instrument: "acoustic" as const, mood: "organic" as const };
        }
      }
    }

    // Initialize brand variables using the suggested or user-configured values
    const initialBrandVariables = {
      brandName,
      brandDescription: `Authentic artisan brand showcasing premium ${analysis.productType.toLowerCase()} crafted from ${analysis.materials.join(", ").toLowerCase()}.`,
      tagline: analysis.suggestedTagline,
      colors,
      logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,15 C20,35 20,65 50,85 C80,65 80,35 50,15 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M50,35 C35,45 35,55 50,70 C65,55 65,45 50,35 Z" fill="currentColor"/>
      </svg>`,
      adBannerCopy: `Discover ${brandName}. Crafted by hand.`,
      audioTheme,
    };

    // Save analysis and variables back to the brand
    const updatedBrand = dbClient.updateBrand(id, {
      productDetails: {
        productType: analysis.productType,
        materials: analysis.materials,
        textures: analysis.textures,
        craftsmanship: analysis.craftsmanship,
        imagenPromptDescription: analysis.imagenPromptDescription,
      },
      brandVariables: initialBrandVariables,
      chatHistory: [
        {
          role: "model",
          content: `I've analyzed your photo of the ${analysis.productType.toLowerCase()}! I detected materials like ${analysis.materials.join(", ").toLowerCase()} and craftsmanship indicating ${analysis.craftsmanship.substring(0, 80)}...

I've generated a draft brand: **${analysis.suggestedBrandName}**.
Should we customize this? Tell me what look or vibe you want to go for (e.g. 'make it look modern', 'go for high luxury', or 'make it feel earthy and rustic')!`,
        },
      ],
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("Ingest endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
