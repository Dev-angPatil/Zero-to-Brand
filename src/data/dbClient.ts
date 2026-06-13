import fs from "fs";
import path from "path";

export interface ProductDetails {
  productType: string;
  materials: string[];
  textures: string[];
  craftsmanship: string;
  imagenPromptDescription: string;
}

export interface AestheticDials {
  rusticVsLuxury: number;
  earthyVsSunDrenched: number;
}

export interface CampaignConfig {
  destinations: string[];
  aestheticDials: AestheticDials;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
}

export interface AudioTheme {
  tempo: number;
  scale: "major" | "minor" | "pentatonic";
  instrument: "acoustic" | "warm-synth" | "bell";
  mood: "organic" | "modern" | "luxury";
}

export interface BrandVariables {
  brandName: string;
  brandDescription: string;
  tagline: string;
  colors: BrandColors;
  logoSvg: string;
  adBannerCopy: string;
  audioTheme: AudioTheme;
  logoImage?: string;
  bannerImage?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface Brand {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "in_progress" | "completed";
  rawImage: string; // Base64 seed image
  productDetails?: ProductDetails;
  config?: CampaignConfig;
  brandVariables?: BrandVariables;
  chatHistory: ChatMessage[];
}

export interface Product {
  id: string;
  brandId: string;
  createdAt: string;
  name: string;
  description: string;
  tagline: string;
  rawImage: string; // Base64 product craft photo
  campaignImage?: string; // Base64 or public path of Imagen banner
  materials: string[];
  textures: string[];
  craftsmanship: string;
  imagenPromptDescription?: string;
}

interface DB {
  brands: Brand[];
  products: Product[];
}

const DB_PATH = path.join(process.cwd(), "src/data/db.json");

// Helper to ensure database is read safely and migrated if needed
function readDB(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify({ brands: [], products: [] }, null, 2));
      return { brands: [], products: [] };
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    const raw = JSON.parse(data);

    let brands: Brand[] = raw.brands || [];
    let products: Product[] = raw.products || [];

    // Migrate old drafts schema if present
    if (raw.drafts && brands.length === 0) {
      console.log("Migrating old drafts to brands and products...");
      brands = raw.drafts.map((d: any) => ({
        id: d.id,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        status: d.status || "in_progress",
        rawImage: d.rawImage,
        productDetails: d.productDetails,
        config: d.config,
        brandVariables: d.brandVariables,
        chatHistory: d.chatHistory || [],
      }));

      // Create products from completed drafts
      for (const b of brands) {
        if (b.status === "completed" && b.productDetails) {
          products.push({
            id: Math.random().toString(36).substring(2, 11),
            brandId: b.id,
            createdAt: b.createdAt,
            name: b.brandVariables?.brandName ? `${b.brandVariables.brandName} Signature Craft` : "Signature Craft",
            description: b.brandVariables?.brandDescription || "Handcrafted artisan piece.",
            tagline: b.brandVariables?.tagline || "Artisan Quality",
            rawImage: b.rawImage,
            campaignImage: b.brandVariables?.bannerImage,
            materials: b.productDetails.materials || [],
            textures: b.productDetails.textures || [],
            craftsmanship: b.productDetails.craftsmanship || "",
          });
        }
      }

      // Save migrated data immediately
      const migrated = { brands, products };
      fs.writeFileSync(DB_PATH, JSON.stringify(migrated, null, 2), "utf8");
    }

    return { brands, products };
  } catch (error) {
    console.error("Error reading database:", error);
    return { brands: [], products: [] };
  }
}

// Helper to write safely to file
function writeDB(db: DB): void {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to database:", error);
  }
}

export const dbClient = {
  // Brand CRUD
  getBrands(): Brand[] {
    const db = readDB();
    return db.brands.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getBrand(id: string): Brand | null {
    const db = readDB();
    return db.brands.find((b) => b.id === id) || null;
  },

  createBrand(rawImage: string): Brand {
    const db = readDB();
    const newBrand: Brand = {
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "in_progress",
      rawImage,
      chatHistory: [],
    };
    db.brands.push(newBrand);
    writeDB(db);
    return newBrand;
  },

  updateBrand(id: string, updates: Partial<Omit<Brand, "id" | "createdAt">>): Brand | null {
    const db = readDB();
    const index = db.brands.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const updatedBrand = {
      ...db.brands[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.brands[index] = updatedBrand;
    writeDB(db);
    return updatedBrand;
  },

  deleteBrand(id: string): boolean {
    const db = readDB();
    const initialLength = db.brands.length;
    db.brands = db.brands.filter((b) => b.id !== id);
    db.products = db.products.filter((p) => p.brandId !== id); // Cascade delete products
    if (db.brands.length === initialLength) return false;
    writeDB(db);
    return true;
  },

  // Product CRUD
  getProducts(brandId: string): Product[] {
    const db = readDB();
    return db.products
      .filter((p) => p.brandId === brandId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getProduct(id: string): Product | null {
    const db = readDB();
    return db.products.find((p) => p.id === id) || null;
  },

  createProduct(brandId: string, product: Omit<Product, "id" | "brandId" | "createdAt">): Product {
    const db = readDB();
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substring(2, 11),
      brandId,
      createdAt: new Date().toISOString(),
    };
    db.products.push(newProduct);
    writeDB(db);
    return newProduct;
  },

  deleteProduct(id: string): boolean {
    const db = readDB();
    const initialLength = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === initialLength) return false;
    writeDB(db);
    return true;
  },
};
