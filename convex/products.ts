import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("products");

    if (args.searchQuery) {
      const results = await ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => {
          let searchQuery = q.search("name", args.searchQuery!);
          if (args.categoryId) {
            searchQuery = searchQuery.eq("categoryId", args.categoryId);
          }
          return searchQuery.eq("isActive", true);
        })
        .paginate(args.paginationOpts);

      return {
        ...results,
        page: await Promise.all(
          results.page.map(async (product) => ({
            ...product,
            imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
            category: await ctx.db.get(product.categoryId),
          }))
        ),
      };
    }

    let results;
    if (args.categoryId) {
      results = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return {
      ...results,
      page: await Promise.all(
        results.page.map(async (product) => ({
          ...product,
          imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
          category: await ctx.db.get(product.categoryId),
        }))
      ),
    };
  },
});

export const get = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return null;
    }

    const category = await ctx.db.get(product.categoryId);
    const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;

    // Get average rating
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return {
      ...product,
      category,
      imageUrl,
      averageRating,
      reviewCount: reviews.length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    stock: v.number(),
    tags: v.array(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create products");
    }

    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
    });
  },
});

export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const newStock = product.stock + args.quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.productId, { stock: newStock });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to upload images");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
