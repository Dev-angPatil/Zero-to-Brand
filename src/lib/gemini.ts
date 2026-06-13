import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

// Check if we should run in simulation mode
const isSimulated = !apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE";

if (isSimulated) {
  console.log("Zero to Brand: Running in GEMINI SIMULATION MODE (No API Key provided).");
}

const ai = !isSimulated ? new GoogleGenAI({ apiKey }) : null;

export interface IngestResult {
  productType: string;
  materials: string[];
  textures: string[];
  craftsmanship: string;
  suggestedBrandName: string;
  suggestedTagline: string;
}

export interface ChatResult {
  response: string;
  brandName: string;
  brandDescription: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  logoSvg: string;
  adBannerCopy: string;
  audioTheme: {
    tempo: number;
    scale: "major" | "minor" | "pentatonic";
    instrument: "acoustic" | "warm-synth" | "bell";
    mood: "organic" | "modern" | "luxury";
  };
}

// Helper to extract clean base64 data and mime type
function parseBase64(base64DataUrl: string) {
  const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: "image/jpeg", data: base64DataUrl };
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

export async function analyzeCraftImage(base64Image: string): Promise<IngestResult> {
  if (isSimulated || !ai) {
    // Wait 2 seconds to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      productType: "Terracotta Clay Pot",
      materials: ["Natural Terracotta Clay", "Iron Oxide Glaze", "River Silt"],
      textures: ["Earthy Grit", "Matte Exterior", "Ribbed Grooves"],
      craftsmanship: "Hand-thrown on a foot-powered kick wheel, wood-fired at 1000°C in a traditional draft kiln.",
      suggestedBrandName: "Hearth & Clay",
      suggestedTagline: "Handcrafted Earth for the Modern Home",
    };
  }

  try {
    const parsed = parseBase64(base64Image);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          },
        },
        "Analyze this artisan craft image and extract details about the product type, raw materials used, surface textures, and cultural craftsmanship. Also suggest a premium brand name and marketing tagline for this item.",
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            productType: { type: "STRING" },
            materials: { type: "ARRAY", items: { type: "STRING" } },
            textures: { type: "ARRAY", items: { type: "STRING" } },
            craftsmanship: { type: "STRING" },
            suggestedBrandName: { type: "STRING" },
            suggestedTagline: { type: "STRING" },
          },
          required: [
            "productType",
            "materials",
            "textures",
            "craftsmanship",
            "suggestedBrandName",
            "suggestedTagline",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text) as IngestResult;
  } catch (error) {
    console.error("Gemini Ingest API Error:", error);
    // Fallback to simulated data if API fails
    return {
      productType: "Handcrafted Pottery",
      materials: ["Clay", "Earth Minerals"],
      textures: ["Grainy", "Tactile"],
      craftsmanship: "Handmade by local artisan.",
      suggestedBrandName: "Earthbound Crafts",
      suggestedTagline: "Earthy designs, hand-shaped with care",
    };
  }
}

export async function chatWithCoPilot(
  message: string,
  history: { role: "user" | "model"; content: string }[],
  base64Image?: string,
  dials?: { rusticVsLuxury: number; earthyVsSunDrenched: number }
): Promise<ChatResult> {
  const dialsContext = dials
    ? `Current aesthetic settings: Rustic vs Luxury is ${dials.rusticVsLuxury}/100, Earthy vs Sun-Drenched is ${dials.earthyVsSunDrenched}/100.`
    : "";

  if (isSimulated || !ai) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowercaseMsg = message.toLowerCase();
    let responseText = "I see. Let's adjust the branding parameters to match your vision.";
    let brandName = "Hearth & Clay";
    let brandDescription = "Authentic, hand-formed terracotta goods designed for peaceful living.";
    let tagline = "Handcrafted Earth for the Modern Home";
    let colors = { primary: "#264e2b", secondary: "#fcd03d", background: "#f7faf2" };
    let logoSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,20 Q30,40 50,80 Q70,40 50,20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.3"/>
    </svg>`;
    let adBannerCopy = "Crafted by sun. Woven by hand.";
    let audioTheme: ChatResult["audioTheme"] = { tempo: 90, scale: "pentatonic", instrument: "acoustic", mood: "organic" };

    if (lowercaseMsg.includes("modern") || lowercaseMsg.includes("minimal")) {
      responseText = "I have updated the brand parameters to feel sleek and modern! I selected a high-contrast charcoal and warm oat color scheme, designed a geometric circular leaf brand mark, and composed a minimal tagline.";
      brandName = "NEO HEARTH";
      brandDescription = "Minimalist clay vessels combining traditional craftsmanship with clean, geometric design.";
      tagline = "Tradition, Refined.";
      colors = { primary: "#1c1c1c", secondary: "#fda055", background: "#fcf9f0" };
      logoSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/>
        <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="3"/>
        <path d="M50,50 L75,75" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
      adBannerCopy = "Pure Form. Deep Heritage.";
      audioTheme = { tempo: 110, scale: "major" as const, instrument: "warm-synth" as const, mood: "modern" as const };
    } else if (lowercaseMsg.includes("luxury") || lowercaseMsg.includes("premium")) {
      responseText = "Absolutely. I have tailored the brand identity to evoke ultra-luxury. We now have a deep emerald and rich gold color palette, a delicate crown-leaf logo SVG, and a refined tone.";
      brandName = "Vase & Co.";
      brandDescription = "Limited batch luxury terracotta vessels crafted for high-end collector spaces.";
      tagline = "The Art of Terracotta";
      colors = { primary: "#0b2612", secondary: "#c5a059", background: "#fcfaf2" };
      logoSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,15 L30,45 L40,75 L60,75 L70,45 Z" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M50,15 L50,75" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2,2"/>
        <circle cx="50" cy="35" r="5" fill="currentColor"/>
      </svg>`;
      adBannerCopy = "Exquisite. Handcrafted. Rare.";
      audioTheme = { tempo: 75, scale: "minor" as const, instrument: "bell" as const, mood: "luxury" as const };
    } else if (lowercaseMsg.includes("rustic") || lowercaseMsg.includes("earthy")) {
      responseText = "Done! I have shifted our focus towards a rustic, workshop aesthetic. The brand mark has a leaf and root contour, the color scheme features deep sage and clay orange, and the audio theme is slow and acoustic.";
      brandName = "Rooted Mud";
      brandDescription = "Tactile, raw ceramics celebrating the natural grain and impurities of wood-fired clay.";
      tagline = "Grown from Clay, Shaped by Hand";
      colors = { primary: "#3e6641", secondary: "#924c00", background: "#f7faf2" };
      logoSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,50 Q50,25 75,50 Q50,75 25,50" fill="none" stroke="currentColor" stroke-width="4"/>
        <path d="M25,50 Q50,85 75,50" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="50" y1="25" x2="50" y2="75" stroke="currentColor" stroke-width="2"/>
      </svg>`;
      adBannerCopy = "Unfinished. Authentic. Beautiful.";
      audioTheme = { tempo: 85, scale: "pentatonic" as const, instrument: "acoustic" as const, mood: "organic" as const };
    } else {
      responseText = `I've registered your feedback: "${message}". I updated the details and logo SVG to represent a harmonious craft aesthetic. Feel free to refine the color palette, name, or jingle!`;
    }

    return {
      response: responseText,
      brandName,
      brandDescription,
      tagline,
      colors,
      logoSvg,
      adBannerCopy,
      audioTheme,
    };
  }

  try {
    const contents: any[] = [];

    if (base64Image) {
      const parsed = parseBase64(base64Image);
      contents.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
    }

    // Add chat history
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Add the current user prompt with guidelines
    const instructions = `
System Instruction:
You are an expert Brand Identity Co-Pilot. The user is an artisan craft creator.
Help the user refine their brand assets based on their query: "${message}".
${dialsContext}

Analyze the user request and generate the response.
Ensure you return a JSON object with:
1. "response": a friendly message explaining the changes and suggestions.
2. "brandName": a refined brand name.
3. "brandDescription": a brief description of the brand identity.
4. "tagline": a short, punchy marketing tagline.
5. "colors": hex codes for primary (text/accents), secondary (highlights), and background. Avoid pure black/white.
6. "logoSvg": A clean, valid SVG string. Must fit a 100x100 viewport. Use 'currentColor' for strokes or fills where possible, or use the brand's primary color, so it integrates cleanly. Use basic geometric or organic SVG tags (<circle>, <path>, <rect>, <line>) and NO external image references.
7. "adBannerCopy": ad banner copy or slogan.
8. "audioTheme": musical settings containing:
   - "tempo": a number from 60 to 140.
   - "scale": one of: "major", "minor", "pentatonic".
   - "instrument": one of: "acoustic", "warm-synth", "bell".
   - "mood": one of: "organic", "modern", "luxury".

Format strictly as JSON.
`;

    contents.push({
      role: "user",
      parts: [{ text: instructions }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            response: { type: "STRING" },
            brandName: { type: "STRING" },
            brandDescription: { type: "STRING" },
            tagline: { type: "STRING" },
            colors: {
              type: "OBJECT",
              properties: {
                primary: { type: "STRING" },
                secondary: { type: "STRING" },
                background: { type: "STRING" },
              },
              required: ["primary", "secondary", "background"],
            },
            logoSvg: { type: "STRING" },
            adBannerCopy: { type: "STRING" },
            audioTheme: {
              type: "OBJECT",
              properties: {
                tempo: { type: "INTEGER" },
                scale: { type: "STRING", enum: ["major", "minor", "pentatonic"] },
                instrument: { type: "STRING", enum: ["acoustic", "warm-synth", "bell"] },
                mood: { type: "STRING", enum: ["organic", "modern", "luxury"] },
              },
              required: ["tempo", "scale", "instrument", "mood"],
            },
          },
          required: [
            "response",
            "brandName",
            "brandDescription",
            "tagline",
            "colors",
            "logoSvg",
            "adBannerCopy",
            "audioTheme",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text) as ChatResult;
  } catch (error) {
    console.error("Gemini Co-Pilot Chat Error:", error);
    // Fallback response
    return {
      response: "I had trouble contacting the design engine, but I preserved our current settings. Tell me what vibe you would like to explore next!",
      brandName: "Artisan Co.",
      brandDescription: "Beautiful handcrafted goods made by local creators.",
      tagline: "Handmade Quality",
      colors: { primary: "#264e2b", secondary: "#745c00", background: "#f7faf2" },
      logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="4"/>
      </svg>`,
      adBannerCopy: "Woven by hand.",
      audioTheme: {
        tempo: 90,
        scale: "pentatonic",
        instrument: "acoustic",
        mood: "organic",
      },
    };
  }
}

export async function generateBrandImages(
  brandName: string,
  mood: string,
  adBannerCopy: string
): Promise<{ logoImage: string; bannerImage: string }> {
  if (isSimulated || !ai) {
    // Wait 2 seconds to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      logoImage: "/images/simulated_logo.png",
      bannerImage: "/images/simulated_banner.png",
    };
  }

  try {
    // Generate Logo Image using Imagen 3
    const logoPrompt = `A clean, minimalist vector-style logo mark for an artisan brand named "${brandName}". Styled with a "${mood}" theme. Isolated on a simple solid light background. High quality graphic design, circular emblem, centered.`;
    const logoResp = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: logoPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: "1:1",
      },
    });

    const logoBase64 = logoResp.generatedImages?.[0]?.image?.imageBytes;
    const logoImage = logoBase64 ? `data:image/png;base64,${logoBase64}` : "/images/simulated_logo.png";

    // Generate Banner Image using Imagen 3
    const bannerPrompt = `A premium, sun-drenched product marketing showcase poster for "${brandName}". Slogan: "${adBannerCopy}". Styled with a "${mood}" theme, organic textures, warm rustic lighting, high-end e-commerce style.`;
    const bannerResp = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: bannerPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
    });

    const bannerBase64 = bannerResp.generatedImages?.[0]?.image?.imageBytes;
    const bannerImage = bannerBase64 ? `data:image/jpeg;base64,${bannerBase64}` : "/images/simulated_banner.png";

    return { logoImage, bannerImage };
  } catch (error) {
    console.error("Imagen API Generation Error:", error);
    return {
      logoImage: "/images/simulated_logo.png",
      bannerImage: "/images/simulated_banner.png",
    };
  }
}

export async function generateProductCopy(
  brandName: string,
  brandDesc: string,
  productType: string,
  materials: string[],
  textures: string[],
  craftsmanship: string
): Promise<{ name: string; description: string; tagline: string }> {
  if (isSimulated || !ai) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      name: `Handcrafted ${productType}`,
      description: `A beautiful piece made of ${materials.join(", ").toLowerCase()}. Featuring a ${textures.join(" and ").toLowerCase()} finish.`,
      tagline: `Finely shaped by hand. Crafted for you.`,
    };
  }

  try {
    const prompt = `
You are a creative brand copywriter for the artisan brand "${brandName}".
Brand Philosophy/Description: "${brandDesc}"

We are launching a new product of type: "${productType}".
Materials: ${materials.join(", ")}
Textures: ${textures.join(", ")}
Craftsmanship: "${craftsmanship}"

Generate:
1. "name": A premium, catchy product name that fits the brand character.
2. "description": A high-conversion, elegant product description (2-3 sentences) highlighting the craftsmanship, materials, and sensory feel.
3. "tagline": A short, punchy product tagline/slogan (under 10 words).

Format strictly as JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            description: { type: "STRING" },
            tagline: { type: "STRING" },
          },
          required: ["name", "description", "tagline"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text) as { name: string; description: string; tagline: string };
  } catch (error) {
    console.error("Gemini Product Copy Generation Error:", error);
    return {
      name: `Handcrafted ${productType}`,
      description: `A beautiful piece made of ${materials.join(", ").toLowerCase()}. Featuring a ${textures.join(" and ").toLowerCase()} finish.`,
      tagline: `Finely shaped by hand. Crafted for you.`,
    };
  }
}

export async function generateProductBanner(
  brandName: string,
  mood: string,
  productName: string,
  productTagline: string
): Promise<string> {
  if (isSimulated || !ai) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "/images/simulated_banner.png";
  }

  try {
    const prompt = `A premium, high-end commercial product showcase photo for "${productName}" by "${brandName}". Tagline: "${productTagline}". Styled in a "${mood}" theme, featuring warm ambient light, organic shadows, elegant styling suitable for a boutique web store. Isolated, high resolution.`;
    const resp = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
    });

    const base64 = resp.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/jpeg;base64,${base64}` : "/images/simulated_banner.png";
  } catch (error) {
    console.error("Imagen Product API Generation Error:", error);
    return "/images/simulated_banner.png";
  }
}


