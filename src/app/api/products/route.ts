import { NextRequest, NextResponse } from "next/server";
import { dbClient, Product } from "@/data/dbClient";
import { analyzeCraftImage, generateProductCopy, generateProductBanner, refineProductBanner, generateStudioImageFromPrompt } from "@/lib/gemini";
import { PreferencesAgent, PromptEngineeringAgent, DesignerAgent } from "@/lib/agents";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  if (!brandId) {
    return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
  }

  const products = dbClient.getProducts(brandId);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    const { brandId, rawImage, sceneDescription, adCopyTone, keywords } = await request.json();
    if (!brandId || !rawImage) {
      return NextResponse.json({ error: "brandId and rawImage are required" }, { status: 400 });
    }

    // 1. Fetch brand variables for styling and copywriting context
    const brand = dbClient.getBrand(brandId);
    if (!brand || brand.status !== "completed" || !brand.brandVariables) {
      return NextResponse.json(
        { error: "Active completed brand not found for the given brandId" },
        { status: 404 }
      );
    }

    const brandVars = brand.brandVariables;

    // 2. Analyze product photo (Gemini Ingest)
    const analysis = await analyzeCraftImage(rawImage);

    // 3. Generate product-specific title, description, and tagline matching brand style
    // Use target adCopyTone if provided
    const copy = await generateProductCopy(
      brandVars.brandName,
      adCopyTone ? `${brandVars.brandDescription} [Tone priority: ${adCopyTone}]` : brandVars.brandDescription,
      analysis.productType,
      analysis.materials,
      analysis.textures,
      analysis.craftsmanship
    );

    // 4. Generate campaign showcase studio image (Imagen 3) using PromptEngineeringAgent
    const studioPrompt = PromptEngineeringAgent.generateStudioImagePrompt(
      analysis.productType,
      analysis.materials,
      analysis.textures,
      analysis.craftsmanship,
      analysis.imagenPromptDescription,
      brandId,
      sceneDescription
    );

    const bannerImage = await generateStudioImageFromPrompt(
      studioPrompt,
      "16:9"
    );

    // 5. Save product in database with questionnaire details
    const newProduct = dbClient.createProduct(brandId, {
      name: copy.name,
      description: copy.description,
      tagline: copy.tagline,
      rawImage,
      campaignImage: bannerImage,
      materials: analysis.materials,
      textures: analysis.textures,
      craftsmanship: analysis.craftsmanship,
      imagenPromptDescription: analysis.imagenPromptDescription,
      sceneDescription: sceneDescription || "",
      adCopyTone: adCopyTone || "Earthy & Organic",
      keywords: keywords || [],
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const { name, tagline, description, feedback, stylePreset, aspectRatio, activeBanner, regenerate } = await request.json();
    const product = dbClient.getProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updates: Partial<Omit<Product, "id" | "brandId" | "createdAt">> = {};
    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (description !== undefined) updates.description = description;
    if (stylePreset !== undefined) updates.stylePreset = stylePreset;
    if (aspectRatio !== undefined) updates.aspectRatio = aspectRatio;

    if (activeBanner !== undefined) {
      updates.campaignImage = activeBanner;
    } else if (regenerate || feedback) {
      const brand = dbClient.getBrand(product.brandId);
      if (!brand || !brand.brandVariables) {
        return NextResponse.json({ error: "Brand details not found" }, { status: 404 });
      }

      const brandVars = brand.brandVariables;
      const brandMood = brandVars.audioTheme?.mood || "organic";
      const refinedName = name || product.name;
      const refinedTagline = tagline || product.tagline;
      const targetFeedback = feedback || "Apply styling preferences";
      const targetPreset = stylePreset !== undefined ? stylePreset : (product.stylePreset || "solarpunk");
      const targetRatio = aspectRatio !== undefined ? aspectRatio : (product.aspectRatio || "16:9");

      const refinedBannerImage = await refineProductBanner(
        brandVars.brandName,
        brandMood,
        refinedName,
        refinedTagline,
        product.imagenPromptDescription || product.description,
        targetFeedback,
        targetPreset,
        targetRatio
      );

      updates.campaignImage = refinedBannerImage;
    }

    const updatedProduct = dbClient.updateProduct(id, updates);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const deleted = dbClient.deleteProduct(id);
  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
