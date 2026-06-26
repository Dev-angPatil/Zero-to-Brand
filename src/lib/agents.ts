import { dbClient } from "@/data/dbClient";

export interface PosterLayout {
  layoutType: "classic" | "minimalist" | "vibrant" | "cinematic";
  fontHeadline: string;
  fontBody: string;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  logoPosition: "top-center" | "top-left" | "bottom-right";
  textAlignment: "left" | "center" | "right";
  borderStyle: string;
  highlightKeywords: string[];
}

export const PreferencesAgent = {
  getPreferences(brandId: string) {
    const brand = dbClient.getBrand(brandId);
    if (!brand) return null;
    return {
      ownerName: brand.config?.ownerName || "Artisan",
      targetAudience: brand.config?.targetAudience || "General Audience",
      designStyle: brand.config?.designStyle || "Solarpunk",
      dials: brand.config?.aestheticDials || { rusticVsLuxury: 50, earthyVsSunDrenched: 50 },
      colors: brand.brandVariables?.colors || { primary: "#264e2b", secondary: "#fcd03d", background: "#f7faf2" },
      brandName: brand.brandVariables?.brandName || "My Brand",
      tagline: brand.brandVariables?.tagline || "Handcrafted with Care",
    };
  },

  getBrandingGuidelines(brandId: string): string {
    const prefs = this.getPreferences(brandId);
    if (!prefs) return "";
    return `Brand Design System:
- Brand Name: ${prefs.brandName}
- Target Audience: ${prefs.targetAudience}
- Brand Aesthetic: ${prefs.designStyle} (Rustic vs Luxury: ${prefs.dials.rusticVsLuxury}/100, Earthy vs Sun-Drenched: ${prefs.dials.earthyVsSunDrenched}/100)
- Brand Colors: Primary: ${prefs.colors.primary}, Secondary: ${prefs.colors.secondary}, Background: ${prefs.colors.background}`;
  }
};

export const PromptEngineeringAgent = {
  generateStudioImagePrompt(
    productType: string,
    materials: string[],
    textures: string[],
    craftsmanship: string,
    imagenPromptDescription: string,
    brandId: string,
    userScene?: string
  ): string {
    const prefs = PreferencesAgent.getPreferences(brandId);
    const dials = prefs?.dials || { rusticVsLuxury: 50, earthyVsSunDrenched: 50 };

    // Compile base visual styles based on brand config
    let ambientStyle = "";
    if (dials.rusticVsLuxury < 35) {
      ambientStyle = "rustic, raw, tactile wood grains, organic textures, natural imperfections";
    } else if (dials.rusticVsLuxury > 65) {
      ambientStyle = "high-end luxury studio, polished surface, elegant minimalist styling, soft clean backdrop";
    } else {
      ambientStyle = "modern artisan fusion, clean composition, soft shadows, warm natural tones";
    }

    const sceneSetting = userScene || (dials.earthyVsSunDrenched > 65 ? "sun-drenched studio workspace" : "warm ambient indoor setting");

    const prompt = `A premium, high-quality professional studio product commercial photo of the physical craft: ${imagenPromptDescription}. Sourced from raw materials like ${materials.join(", ")} with ${textures.join(", ")} textures, representing ${craftsmanship}. Setting: placed beautifully in a ${sceneSetting}. Lighting and style: ${ambientStyle}, with organic shadows, commercial e-commerce quality, highly detailed, stunning visual presentation.`;

    return prompt;
  }
};

export const DesignerAgent = {
  composePosterLayout(brandId: string, productTitle: string, keywords: string[]): PosterLayout {
    const prefs = PreferencesAgent.getPreferences(brandId);
    const designStyle = prefs?.designStyle?.toLowerCase() || "solarpunk";
    const colors = prefs?.colors || { primary: "#264e2b", secondary: "#fcd03d", background: "#f7faf2" };

    let layoutType: PosterLayout["layoutType"] = "classic";
    let fontHeadline = "Playfair Display, serif";
    let fontBody = "Inter, sans-serif";
    let logoPosition: PosterLayout["logoPosition"] = "top-left";
    let textAlignment: PosterLayout["textAlignment"] = "left";
    let borderStyle = "border-none";

    if (designStyle.includes("minimalist")) {
      layoutType = "minimalist";
      fontHeadline = "Outfit, sans-serif";
      fontBody = "Inter, sans-serif";
      logoPosition = "top-center";
      textAlignment = "center";
      borderStyle = "border border-outline/10";
    } else if (designStyle.includes("cyberpunk")) {
      layoutType = "cinematic";
      fontHeadline = "Orbitron, sans-serif";
      fontBody = "Roboto, sans-serif";
      logoPosition = "top-left";
      textAlignment = "left";
      borderStyle = "border-2 border-primary";
    } else if (designStyle.includes("solarpunk")) {
      layoutType = "vibrant";
      fontHeadline = "Fraunces, serif";
      fontBody = "Outfit, sans-serif";
      logoPosition = "top-left";
      textAlignment = "left";
      borderStyle = "rounded-[32px] border border-secondary/20";
    } else if (designStyle.includes("vintage")) {
      layoutType = "classic";
      fontHeadline = "Cinzel, serif";
      fontBody = "Lora, serif";
      logoPosition = "top-center";
      textAlignment = "center";
      borderStyle = "border-double border-4 border-primary/40";
    }

    return {
      layoutType,
      fontHeadline,
      fontBody,
      textColor: colors.primary,
      accentColor: colors.secondary,
      backgroundColor: colors.background,
      logoPosition,
      textAlignment,
      borderStyle,
      highlightKeywords: keywords.slice(0, 5)
    };
  }
};
