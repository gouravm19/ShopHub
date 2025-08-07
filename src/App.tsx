import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import OrderHistory from "./components/OrderHistory";
import AdminPanel from "./components/AdminPanel";
import SeedButton from "./components/SeedButton";

export default function App() {
  const [currentView, setCurrentView] = useState<"products" | "cart" | "orders" | "admin">("products");
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const categories = useQuery(api.categories.list);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-blue-600">ShopHub</h1>
            <Authenticated>
              <nav className="flex gap-6">
                <button
                  onClick={() => setCurrentView("products")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentView === "products" 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setCurrentView("cart")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentView === "cart" 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cart
                </button>
                <button
                  onClick={() => setCurrentView("orders")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentView === "orders" 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentView === "admin" 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Admin
                </button>
              </nav>
            </Authenticated>
          </div>
          <div className="flex items-center gap-4">
            <Authenticated>
              {categories?.length === 0 && <SeedButton />}
              <span className="text-sm text-gray-600">
                Welcome, {loggedInUser?.name || loggedInUser?.email || "User"}!
              </span>
            </Authenticated>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-md mx-auto p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to ShopHub</h2>
                <p className="text-gray-600">Your one-stop e-commerce destination</p>
                <p className="text-gray-500 text-sm mt-2">Sign in to start shopping</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {currentView === "products" && <ProductList />}
            {currentView === "cart" && <Cart />}
            {currentView === "orders" && <OrderHistory />}
            {currentView === "admin" && <AdminPanel />}
          </div>
        </Authenticated>
      </main>

      <Toaster />
    </div>
  );
}
