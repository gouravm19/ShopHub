import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        imageUrl: category.imageId ? await ctx.storage.getUrl(category.imageId) : null,
      }))
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create categories");
    }

    return await ctx.db.insert("categories", args);
  },
});
