import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const create = mutation({
  args: {
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create orders");
    }

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      const product = await ctx.db.get(cartItem.productId);
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found`);
      }

      if (product.stock < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        priceAtTime: product.price,
      });
    }

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId,
      status: "pending",
      totalAmount,
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod,
    });

    // Create order items and update stock
    for (const orderItemData of orderItemsData) {
      await ctx.db.insert("orderItems", {
        orderId,
        ...orderItemData,
      });

      // Update product stock
      const product = await ctx.db.get(orderItemData.productId);
      if (product) {
        await ctx.db.patch(orderItemData.productId, {
          stock: product.stock - orderItemData.quantity,
        });
      }
    }

    // Clear cart
    for (const cartItem of cartItems) {
      await ctx.db.delete(cartItem._id);
    }

    return orderId;
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const results = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await Promise.all(
        results.page.map(async (order) => {
          const orderItems = await ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect();

          const items = await Promise.all(
            orderItems.map(async (item) => {
              const product = await ctx.db.get(item.productId);
              return {
                ...item,
                product: product ? {
                  ...product,
                  imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
                } : null,
              };
            })
          );

          return {
            ...order,
            items,
          };
        })
      ),
    };
  },
});

export const get = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
      return null;
    }

    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    const items = await Promise.all(
      orderItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product: {
            ...product,
            imageUrl: product?.imageId ? await ctx.storage.getUrl(product.imageId) : null,
          },
        };
      })
    );

    return {
      ...order,
      items,
    };
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // For demo purposes, allow users to update their own orders
    // In production, this would be restricted to admin users
    if (order.userId !== userId) {
      throw new Error("Not authorized to update this order");
    }

    await ctx.db.patch(args.orderId, { status: args.status });
  },
});
