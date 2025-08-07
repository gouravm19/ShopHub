import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) {
          return null;
        }
        return {
          ...item,
          product: {
            ...product,
            imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
          },
          subtotal: product.price * item.quantity,
        };
      })
    ).then(items => items.filter(Boolean));
  },
});

export const addItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add items to cart");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock < args.quantity) {
      throw new Error("Insufficient stock");
    }

    // Check if item already exists in cart
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) => 
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .unique();

    if (existingItem) {
      const newQuantity = existingItem.quantity + args.quantity;
      if (product.stock < newQuantity) {
        throw new Error("Insufficient stock");
      }
      await ctx.db.patch(existingItem._id, { quantity: newQuantity });
    } else {
      await ctx.db.insert("cartItems", {
        userId,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
      return;
    }

    const product = await ctx.db.get(cartItem.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock < args.quantity) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
  },
});

export const removeItem = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }

    await ctx.db.delete(args.cartItemId);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});
