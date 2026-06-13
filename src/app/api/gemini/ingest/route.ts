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

    // Initialize brand variables using the suggested values
    const initialBrandVariables = {
      brandName: analysis.suggestedBrandName,
      brandDescription: `Authentic artisan brand showcasing premium ${analysis.productType.toLowerCase()} crafted from ${analysis.materials.join(", ").toLowerCase()}.`,
      tagline: analysis.suggestedTagline,
      colors: {
        primary: "#264e2b", // Solarpunk default deep olive green
        secondary: "#fcd03d", // Sunflower yellow accent
        background: "#f7faf2", // Sage cream
      },
      logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,15 C20,35 20,65 50,85 C80,65 80,35 50,15 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M50,35 C35,45 35,55 50,70 C65,55 65,45 50,35 Z" fill="currentColor"/>
      </svg>`,
      adBannerCopy: "Crafted by hand. Styled by nature.",
      audioTheme: {
        tempo: 90,
        scale: "pentatonic" as const,
        instrument: "acoustic" as const,
        mood: "organic" as const,
      },
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
