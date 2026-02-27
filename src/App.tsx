import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import ScanMeal from "./pages/ScanMeal";
import Recipes from "./pages/Recipes";
import GroceryList from "./pages/GroceryList";
import FitnessPlan from "./pages/FitnessPlan";
import BMICalculator from "./pages/BMICalculator";
import AIChat from "./pages/AIChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/scan" element={<ScanMeal />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/grocery" element={<GroceryList />} />
              <Route path="/fitness" element={<FitnessPlan />} />
              <Route path="/bmi" element={<BMICalculator />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
