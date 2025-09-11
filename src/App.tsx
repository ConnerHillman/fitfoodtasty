import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/menu" element={<Layout><Menu /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/orders" element={<RequireAuth><Layout><Orders /></Layout></RequireAuth>} />
            <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
            <Route path="/admin" element={<RequireAuth><Layout><AdminDashboard /></Layout></RequireAuth>} />
            <Route path="/business" element={<RequireAuth><Layout><BusinessDashboard /></Layout></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
            <Route path="/business/*" element={<RequireAuth><Layout><BusinessDashboard /></Layout></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
