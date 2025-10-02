// /src/App.tsx
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { RecentsProvider } from "@/contexts/RecentsContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";

const Home = lazy(() => import("@/pages/Home"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const CategoryChannels = lazy(() => import("@/pages/CategoryChannels"));
const ChannelPlayer = lazy(() => import("@/pages/ChannelPlayer"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="iptv-ui-theme">
        <Toaster />
        <Sonner />
        <Router>
          <FavoritesProvider>
            <RecentsProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Switch>
                  <Route path="/">
                    <Layout><Home /></Layout>
                  </Route>
                  <Route path="/favorites">
                    <Layout><Favorites /></Layout>
                  </Route>
                  <Route path="/category/:slug">
                    {(params) => <Layout><CategoryChannels /></Layout>}
                  </Route>
                  <Route path="/channel/:channelId">
                    {(params) => <Layout><ChannelPlayer /></Layout>}
                  </Route>
                  <Route path="/admin/:rest*">
                    <Admin />
                  </Route>
                  <Route>
                    <NotFound />
                  </Route>
                </Switch>
              </Suspense>
            </RecentsProvider>
          </FavoritesProvider>
        </Router>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
