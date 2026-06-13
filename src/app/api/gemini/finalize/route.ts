import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/data/dbClient";
import { generateBrandImages } from "@/lib/gemini";

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

    const brandVariables = brand.brandVariables;
    if (!brandVariables) {
      return NextResponse.json({ error: "Brand variables not initialized" }, { status: 400 });
    }

    // Call Gemini Imagen to generate the brand logo and banner
    const images = await generateBrandImages(
      brandVariables.brandName,
      brandVariables.audioTheme.mood || "organic",
      brandVariables.adBannerCopy,
      brand.productDetails?.imagenPromptDescription
    );

    // Update brand with generated logo and banner images, and set completed status
    const updatedBrand = dbClient.updateBrand(id, {
      status: "completed",
      brandVariables: {
        ...brandVariables,
        logoImage: images.logoImage,
        bannerImage: images.bannerImage,
      },
    });

    // Create the brand's very first Product using the seed image and product details
    if (brand.productDetails) {
      dbClient.createProduct(id, {
        name: `${brandVariables.brandName} Signature Craft`,
        description: brandVariables.brandDescription || "Signature piece that inspired the brand's aesthetics.",
        tagline: brandVariables.tagline || "Handcrafted Heritage",
        rawImage: brand.rawImage,
        campaignImage: images.bannerImage,
        materials: brand.productDetails.materials,
        textures: brand.productDetails.textures,
        craftsmanship: brand.productDetails.craftsmanship,
        imagenPromptDescription: brand.productDetails.imagenPromptDescription,
      });
    }

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("Finalize endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
