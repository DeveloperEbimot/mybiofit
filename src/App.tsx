import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import RouteChangeTracker from "@/components/RouteChangeTracker";
import AdminRoute from "@/components/AdminRoute";
import "@/i18n";

const Index = lazy(() => import("./pages/Index"));
const ScanMeal = lazy(() => import("./pages/ScanMeal"));
const Recipes = lazy(() => import("./pages/Recipes"));
const GroceryList = lazy(() => import("./pages/GroceryList"));
const FitnessPlan = lazy(() => import("./pages/FitnessPlan"));
const BMICalculator = lazy(() => import("./pages/BMICalculator"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Statistics = lazy(() => import("./pages/Statistics"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const LanguageSelect = lazy(() => import("./pages/LanguageSelect"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteChangeTracker />
          <AppLayout>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/scan" element={<ScanMeal />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/grocery" element={<GroceryList />} />
                <Route path="/fitness" element={<FitnessPlan />} />
                <Route path="/bmi" element={<BMICalculator />} />
                <Route path="/chat" element={<AIChat />} />
                <Route path="/stats" element={<Statistics />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/language" element={<LanguageSelect />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
