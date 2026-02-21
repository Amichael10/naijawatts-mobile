import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LightningLoader from "./components/LightningLoader";
import HomePage from "./pages/HomePage";
import CompoundSetupPage from "./pages/CompoundSetupPage";
import CompoundDetailPage from "./pages/CompoundDetailPage";
import CalculatePage from "./pages/CalculatePage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [splash, setSplash] = useState(true);

  if (splash) {
    return <LightningLoader onComplete={() => setSplash(false)} text="Loading" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compound/new" element={<CompoundSetupPage />} />
            <Route path="/compound/:id" element={<CompoundDetailPage />} />
            <Route path="/compound/:id/edit" element={<CompoundSetupPage />} />
            <Route path="/calculate" element={<CalculatePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:compoundId" element={<HistoryPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
