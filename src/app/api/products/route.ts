import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/data/dbClient";
import { analyzeCraftImage, generateProductCopy, generateProductBanner } from "@/lib/gemini";

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
    const { brandId, rawImage } = await request.json();
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
    const copy = await generateProductCopy(
      brandVars.brandName,
      brandVars.brandDescription,
      analysis.productType,
      analysis.materials,
      analysis.textures,
      analysis.craftsmanship
    );

    // 4. Generate campaign showcase banner (Imagen 3)
    const brandMood = brandVars.audioTheme?.mood || "organic";
    const bannerImage = await generateProductBanner(
      brandVars.brandName,
      brandMood,
      copy.name,
      copy.tagline,
      analysis.imagenPromptDescription
    );

    // 5. Save product in database
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
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product campaign:", error);
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
