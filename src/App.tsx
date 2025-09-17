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
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import AllOrders from "./pages/AllOrders";
import OrderDetails from "./pages/OrderDetails";

import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
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
import EmailConfirmation from "./pages/EmailConfirmation";

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
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/menu" element={<Layout><Menu /></Layout>} />
            <Route path="/packages" element={<Layout><Packages /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/orders" element={<RequireAuth><Layout><Orders /></Layout></RequireAuth>} />
            <Route path="/orders/all" element={<RequireAuth><AllOrders /></RequireAuth>} />
            <Route path="/orders/:orderId" element={<RequireAuth><OrderDetails /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><Layout><AccountSettings /></Layout></RequireAuth>} />
            <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
            <Route path="/admin" element={<RequireAuth><Layout><AdminDashboard /></Layout></RequireAuth>} />
            <Route path="/business/settings" element={<RequireAuth><Layout><BusinessSettings /></Layout></RequireAuth>} />
            <Route path="/referral-reports" element={<RequireAuth><Layout><ReferralReports /></Layout></RequireAuth>} />
            <Route path="/labels" element={<RequireAuth><LabelGenerator /></RequireAuth>} />
            <Route path="/gift-cards" element={<Layout><GiftCards /></Layout>} />
            <Route path="/gift-card-balance" element={<Layout><GiftCardBalance /></Layout>} />
            <Route path="/gift-card-success" element={<Layout><GiftCardSuccess /></Layout>} />
            <Route path="/gift-card-failure" element={<Layout><GiftCardFailure /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />
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
