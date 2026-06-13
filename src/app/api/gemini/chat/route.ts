import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/data/dbClient";
import { chatWithCoPilot } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { id, message } = await request.json();
    if (!id || !message) {
      return NextResponse.json({ error: "Brand ID and message are required" }, { status: 400 });
    }

    const brand = dbClient.getBrand(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Append the user's message to the history
    const updatedHistory = [...brand.chatHistory, { role: "user" as const, content: message }];

    // Call Gemini chat co-pilot
    const chatResult = await chatWithCoPilot(
      message,
      brand.chatHistory,
      brand.rawImage,
      brand.config?.aestheticDials
    );

    // Prepare updated brand variables
    const updatedBrandVariables = {
      brandName: chatResult.brandName,
      brandDescription: chatResult.brandDescription,
      tagline: chatResult.tagline,
      colors: chatResult.colors,
      logoSvg: chatResult.logoSvg,
      adBannerCopy: chatResult.adBannerCopy,
      audioTheme: chatResult.audioTheme,
    };

    // Save history and new brand variables
    const updatedBrand = dbClient.updateBrand(id, {
      brandVariables: updatedBrandVariables,
      chatHistory: [...updatedHistory, { role: "model" as const, content: chatResult.response }],
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
