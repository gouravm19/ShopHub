import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    description: v.string(),
    imageId: v.optional(v.id("_storage")),
  }),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    imageId: v.optional(v.id("_storage")),
    stock: v.number(),
    isActive: v.boolean(),
    tags: v.array(v.string()),
  })
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["categoryId", "isActive"],
    }),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    paymentMethod: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    priceAtTime: v.number(),
  })
    .index("by_order", ["orderId"]),

  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    rating: v.number(),
    comment: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
