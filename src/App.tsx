import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import RouteChangeTracker from "@/components/RouteChangeTracker";

const Index = lazy(() => import("./pages/Index"));
const ScanMeal = lazy(() => import("./pages/ScanMeal"));
const Recipes = lazy(() => import("./pages/Recipes"));
const GroceryList = lazy(() => import("./pages/GroceryList"));
const FitnessPlan = lazy(() => import("./pages/FitnessPlan"));
const BMICalculator = lazy(() => import("./pages/BMICalculator"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Ratings = lazy(() => import("./pages/Ratings"));
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
                <Route path="/ratings" element={<Ratings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
