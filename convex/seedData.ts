import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      return "Database already seeded";
    }

    // Create categories
    const electronicsId = await ctx.db.insert("categories", {
      name: "Electronics",
      description: "Latest gadgets and electronic devices",
    });

    const clothingId = await ctx.db.insert("categories", {
      name: "Clothing",
      description: "Fashion and apparel for all occasions",
    });

    const homeId = await ctx.db.insert("categories", {
      name: "Home & Garden",
      description: "Everything for your home and garden",
    });

    const booksId = await ctx.db.insert("categories", {
      name: "Books",
      description: "Books, magazines, and educational materials",
    });

    // Create sample products
    const products = [
      {
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation and 30-hour battery life",
        price: 199.99,
        categoryId: electronicsId,
        stock: 50,
        tags: ["audio", "wireless", "bluetooth"],
      },
      {
        name: "Smartphone Pro Max",
        description: "Latest flagship smartphone with advanced camera system and 5G connectivity",
        price: 999.99,
        categoryId: electronicsId,
        stock: 25,
        tags: ["phone", "5g", "camera"],
      },
      {
        name: "Laptop Gaming Edition",
        description: "High-performance gaming laptop with RTX graphics and 16GB RAM",
        price: 1499.99,
        categoryId: electronicsId,
        stock: 15,
        tags: ["laptop", "gaming", "performance"],
      },
      {
        name: "Classic Cotton T-Shirt",
        description: "Comfortable 100% cotton t-shirt available in multiple colors",
        price: 24.99,
        categoryId: clothingId,
        stock: 100,
        tags: ["cotton", "casual", "basic"],
      },
      {
        name: "Designer Jeans",
        description: "Premium denim jeans with modern fit and sustainable materials",
        price: 89.99,
        categoryId: clothingId,
        stock: 75,
        tags: ["denim", "sustainable", "fashion"],
      },
      {
        name: "Smart Home Hub",
        description: "Central control hub for all your smart home devices",
        price: 149.99,
        categoryId: homeId,
        stock: 30,
        tags: ["smart", "home", "automation"],
      },
      {
        name: "Coffee Maker Deluxe",
        description: "Professional-grade coffee maker with programmable settings",
        price: 299.99,
        categoryId: homeId,
        stock: 20,
        tags: ["coffee", "kitchen", "appliance"],
      },
      {
        name: "Programming Fundamentals",
        description: "Comprehensive guide to learning programming from scratch",
        price: 39.99,
        categoryId: booksId,
        stock: 200,
        tags: ["programming", "education", "technology"],
      },
      {
        name: "The Art of Design",
        description: "Beautiful coffee table book showcasing modern design principles",
        price: 59.99,
        categoryId: booksId,
        stock: 40,
        tags: ["design", "art", "coffee-table"],
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", {
        ...product,
        isActive: true,
      });
    }

    return "Database seeded successfully";
  },
});
