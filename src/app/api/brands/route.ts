import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/data/dbClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const brand = dbClient.getBrand(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json(brand);
  }

  const brands = dbClient.getBrands();
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  try {
    const { rawImage } = await request.json();
    if (!rawImage) {
      return NextResponse.json({ error: "rawImage is required" }, { status: 400 });
    }

    const newBrand = dbClient.createBrand(rawImage);
    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    const updates = await request.json();
    const updatedBrand = dbClient.updateBrand(id, updates);

    if (!updatedBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
  }

  const deleted = dbClient.deleteBrand(id);
  if (!deleted) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
