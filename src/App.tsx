// src/App.tsx
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter"; // Assuming Wouter is used as per the PDF notes
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { RecentsProvider } from "./contexts/RecentsContext";
import { LoadingFallback } from "./components/LoadingFallback"; // Placeholder, likely defined inline or separately
import Layout from "./components/Layout"; // Assuming a main layout component exists

// Dynamically import your pages/components
const Home = lazy(() => import("./pages/Home"));
const CategoryChannels = lazy(() => import("./pages/CategoryChannels")); // This is likely what loads when tapping "BDIX"
const ChannelPlayer = lazy(() => import("./pages/ChannelPlayer"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));
// ... other pages

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <RecentsProvider>
          <TooltipProvider>
            <Router>
              <Layout> {/* Layout might contain Header, Sidebar, BottomNav, Footer */}
                <Suspense fallback={<LoadingFallback />}> {/* This is the key Suspense boundary */}
                  {/* Define your routes here using Wouter */}
                  <Route path="/" component={Home} />
                  <Route path="/category/:id" component={CategoryChannels} /> {/* Route for categories like BDIX */}
                  <Route path="/channel/:id" component={ChannelPlayer} />
                  <Route path="/favorites" component={Favorites} />
                  {/* Add other routes as needed */}
                  <Route path="*" component={NotFound} /> {/* Catch-all for 404s */}
                </Suspense>
              </Layout>
            </Router>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </RecentsProvider>
      </FavoritesProvider>
    </QueryClientProvider>
  );
}

export default App;
