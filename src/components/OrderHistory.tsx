import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function OrderHistory() {
  const ordersResult = useQuery(api.orders.list, {
    paginationOpts: { numItems: 10, cursor: null },
  });
  const updateOrderStatus = useMutation(api.orders.updateStatus);

  const handleStatusUpdate = async (orderId: Id<"orders">, status: "pending" | "processing" | "shipped" | "delivered" | "cancelled") => {
    try {
      await updateOrderStatus({ orderId, status });
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

      {ordersResult?.page.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 text-lg">No orders yet</p>
          <p className="text-gray-400 mt-2">Your order history will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersResult?.page.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order._id.slice(-8)}</h3>
                    <p className="text-gray-600">
                      Placed on {new Date(order._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-semibold mb-4">Items ({order.items.length})</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-center gap-4">
                      {item.product?.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-gray-600 text-sm">
                          ${item.priceAtTime.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.priceAtTime * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Shipping Address:</p>
                      <p className="text-sm">
                        {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, "cancelled")}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
