import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";

export default function Cart() {
  const cartItems = useQuery(api.cart.list) || [];
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const [showCheckout, setShowCheckout] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + (item?.subtotal || 0), 0);

  const handleUpdateQuantity = async (cartItemId: Id<"cartItems">, quantity: number) => {
    try {
      await updateQuantity({ cartItemId, quantity });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (cartItemId: Id<"cartItems">) => {
    try {
      await removeItem({ cartItemId });
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    }
  };

  if (showCheckout) {
    return <CheckoutForm onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <p className="text-gray-400 mt-2">Add some products to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-sm">
            {cartItems.filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => (
              <div key={item._id} className="p-6 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center gap-4">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-gray-600 text-sm">{item.product.description}</p>
                    <p className="text-blue-600 font-semibold">${item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-semibold"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
