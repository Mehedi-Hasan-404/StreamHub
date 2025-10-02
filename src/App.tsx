// src/App.tsx
import { lazy, Suspense } from "react"; // Import Suspense and lazy
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter"; // Assuming Wouter is used as per the PDF notes
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { RecentsProvider } from "./contexts/RecentsContext";
import Layout from "./components/Layout"; // Assuming a main layout component exists

// --- Dynamically import your pages/components ---
const Home = lazy(() => import("./pages/Home"));
const CategoryChannels = lazy(() => import("./pages/CategoryChannels")); // This is likely what loads when tapping "BDIX"
const ChannelPlayer = lazy(() => import("./pages/ChannelPlayer"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));
// ... other pages

const queryClient = new QueryClient();

// --- Define the fallback UI *inside* App.tsx (As per PDF lines 28-36) ---
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <RecentsProvider>
          <TooltipProvider>
            <Router>
              <Layout> {/* Layout might contain Header, Sidebar, BottomNav, Footer */}
                {/* The key Suspense boundary wrapping the routing - This causes the blank screen */}
                <Suspense fallback={<LoadingFallback />}>
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
