import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "@/contexts/SocketContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LiaVolumeProvider } from "@/contexts/LiaVolumeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import CheckEmail from "./pages/CheckEmail";
import SetupPassword from "./pages/SetupPassword";
import ForgotPassword from "./pages/ForgotPassword";
import InstagramCallback from "./pages/InstagramCallback";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import MeuPrompt from "./pages/MeuPrompt";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Lgpd from "./pages/Lgpd";
import Trafego from "./pages/Trafego";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import YourExperiencePage from "./pages/YourExperiencePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <LiaVolumeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                <Route path="/termos-de-servico" element={<TermsOfService />} />
                <Route path="/lgpd" element={<Lgpd />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/meu-prompt" element={
                  <ProtectedRoute>
                    <MeuPrompt />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/payment" element={<Payment />} />
                <Route path="/check-email" element={<CheckEmail />} />
                <Route path="/setup-password" element={<SetupPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/instagram-callback" element={<InstagramCallback />} />
                <Route path="/calendar-callback" element={<GoogleCalendarCallback />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/sua-experiencia" element={<YourExperiencePage />} />
                <Route path="/trafego" element={<Trafego />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </LiaVolumeProvider>
        </AuthProvider>
      </TooltipProvider>
    </SocketProvider>
  </QueryClientProvider>
);

export default App;
