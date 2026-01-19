import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import BusinessSettings from "./pages/BusinessSettings";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Packages from "./pages/Packages";
import PackageSelect from "./pages/PackageSelect";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import AllOrders from "./pages/AllOrders";
import OrderDetails from "./pages/OrderDetails";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import PaymentSuccess from "./pages/PaymentSuccess";
import AccountSettings from "./pages/AccountSettings";
import ReferralReports from "./pages/ReferralReports";
import LabelGenerator from "./pages/LabelGenerator";
import GiftCards from "./pages/GiftCards";
import GiftCardBalance from "./pages/GiftCardBalance";
import GiftCardSuccess from "./pages/GiftCardSuccess";
import GiftCardFailure from "./pages/GiftCardFailure";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Subscriptions from "./pages/Subscriptions";
import FAQ from "./pages/FAQ";
import Reorder from "./pages/Reorder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/menu" element={<AppLayout><Menu /></AppLayout>} />
            <Route path="/packages" element={<AppLayout><Packages /></AppLayout>} />
            <Route path="/packages/:packageId/select" element={<PackageSelect />} />
            <Route path="/about" element={<AppLayout><About /></AppLayout>} />
            <Route path="/cart" element={<AppLayout><Cart /></AppLayout>} />
            <Route path="/orders" element={<RequireAuth><AppLayout><Orders /></AppLayout></RequireAuth>} />
            <Route path="/subscriptions" element={<RequireAuth><AppLayout><Subscriptions /></AppLayout></RequireAuth>} />
            <Route path="/orders/all" element={<RequireAuth><AllOrders /></RequireAuth>} />
            <Route path="/orders/:orderId" element={<RequireAuth><OrderDetails /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AppLayout><AccountSettings /></AppLayout></RequireAuth>} />
            <Route path="/payment-success" element={<AppLayout><PaymentSuccess /></AppLayout>} />
            <Route path="/admin" element={<RequireAdmin><AppLayout><AdminDashboard /></AppLayout></RequireAdmin>} />
            <Route path="/business/settings" element={<RequireAdmin><AppLayout><BusinessSettings /></AppLayout></RequireAdmin>} />
            <Route path="/referral-reports" element={<RequireAdmin><AppLayout><ReferralReports /></AppLayout></RequireAdmin>} />
            <Route path="/labels" element={<RequireAdmin><LabelGenerator /></RequireAdmin>} />
            <Route path="/gift-cards" element={<AppLayout><GiftCards /></AppLayout>} />
            <Route path="/gift-card-balance" element={<AppLayout><GiftCardBalance /></AppLayout>} />
            <Route path="/gift-card-success" element={<AppLayout><GiftCardSuccess /></AppLayout>} />
            <Route path="/gift-card-failure" element={<AppLayout><GiftCardFailure /></AppLayout>} />
            <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
            <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
            <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
            <Route path="/faq" element={<AppLayout><FAQ /></AppLayout>} />
            <Route path="/reorder/:orderId" element={<RequireAuth><AppLayout><Reorder /></AppLayout></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
