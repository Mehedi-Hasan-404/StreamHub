// /src/pages/CategoryChannels.tsx (Your provided full code)
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PublicChannel, Category } from '@/types';
import ChannelCard from '@/components/ChannelCard';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Tv, Search, ArrowLeft } from 'lucide-react';

const CategoryChannels = () => {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [channels, setChannels] = useState<PublicChannel[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true); // <-- Initial state is true
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChannels, setFilteredChannels] = useState<PublicChannel[]>([]);

  // Fetch data when slug changes
  useEffect(() => {
    if (slug) {
      fetchCategoryAndChannels(); // <-- This starts the data fetching
    }
  }, [slug]);

  // Filter channels based on search query
  useEffect(() => {
    if (channels.length > 0) {
      const filtered = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChannels(filtered);
    } else {
      setFilteredChannels([]);
    }
  }, [searchQuery, channels]);

  // Parse M3U content to extract channel info
  const parseM3U = (m3uContent: string, categoryId: string, categoryName: string): PublicChannel[] => {
    const lines = m3uContent.split('\n').map(line => line.trim()).filter(line => line);
    const channels: PublicChannel[] = [];
    let currentChannel: Partial<PublicChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const channelName = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const logoUrl = logoMatch ? logoMatch[1] : '/placeholder.svg';
        
        currentChannel = {
          name: channelName,
          logoUrl: logoUrl,
          categoryId,
          categoryName,
        };
      } else if (line && !line.startsWith('#') && currentChannel.name) {
        const cleanChannelName = currentChannel.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const channel: PublicChannel = {
          id: `${categoryId}_${cleanChannelName}_${channels.length}`,
          name: currentChannel.name,
          logoUrl: currentChannel.logoUrl || '/placeholder.svg',
          streamUrl: line,
          categoryId,
          categoryName,
        };
        channels.push(channel);
        currentChannel = {}; // Reset for next channel
      }
    }

    return channels;
  };

  // Fetch and parse an M3U playlist from a URL
  const fetchM3UPlaylist = async (m3uUrl: string, categoryId: string, categoryName: string): Promise<PublicChannel[]> => {
    try {
      const response = await fetch(m3uUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U playlist: ${response.statusText}`);
      }
      const m3uContent = await response.text();
      return parseM3U(m3uContent, categoryId, categoryName);
    } catch (error) {
      console.error('Error fetching M3U playlist:', error);
      return [];
    }
  };

  // Main function to fetch category and its channels
  const fetchCategoryAndChannels = async () => {
    try {
      setLoading(true); // <-- Set loading to true when fetch starts
      setError(null);

      // Find the category by slug in Firestore
      const categoriesRef = collection(db, 'categories');
      const categoryQuery = query(categoriesRef, where('slug', '==', slug));
      const categorySnapshot = await getDocs(categoryQuery);

      if (categorySnapshot.empty) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      const categoryDoc = categorySnapshot.docs[0];
      const categoryData = { id: categoryDoc.id, ...categoryDoc.data() } as Category;
      setCategory(categoryData);

      let allChannels: PublicChannel[] = [];

      // If category has an M3U URL, fetch and parse it
      if (categoryData.m3uUrl) {
        const m3uChannels = await fetchM3UPlaylist(
          categoryData.m3uUrl, 
          categoryData.id, 
          categoryData.name
        );
        if (m3uChannels.length > 0) {
          allChannels = [...allChannels, ...m3uChannels];
          console.log(`Loaded ${m3uChannels.length} channels from M3U playlist`);
        } else {
          console.log('No channels loaded from M3U playlist or fetch failed');
        }
      }

      // Also fetch manually added channels from Firestore
      try {
        const channelsRef = collection(db, 'channels');
        const channelsQuery = query(channelsRef, where('categoryId', '==', categoryData.id));
        const channelsSnapshot = await getDocs(channelsQuery);
        
        const manualChannels = channelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PublicChannel[];

        allChannels = [...allChannels, ...manualChannels];
      } catch (firestoreError) {
        console.error('Error fetching manual channels:', firestoreError);
      }

      console.log(`Total channels loaded: ${allChannels.length}`);
      setChannels(allChannels);

    } catch (error) {
      console.error('Error fetching category and channels:', error);
      setError('Failed to load channels. Please try again.');
    } finally {
      setLoading(false); // <-- Set loading to false when fetch completes (or fails)
    }
  };

  // --- Render loading state (Skeleton UI) ---
  // This happens *after* App.tsx Suspense resolves and CategoryChannels mounts
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="channels-grid-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render "Category not found" if data is missing
  if (!category) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Category not found.</AlertDescription>
      </Alert>
    );
  }

  // --- Render normal state (channel list) ---
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="-mt-2">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 pl-0"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tv size={24} />
          {category.name}
        </h1>
        <p className="text-text-secondary">
          {channels.length} channel{channels.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
        <input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        )}
      </div>

      {filteredChannels.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <Search size={48} className="text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No channels found</h3>
          <p className="text-text-secondary">
            No channels match "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12">
          <Tv size={48} className="text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Channels Available</h3>
          <p className="text-text-secondary">
            No channels have been added to this category yet.
          </p>
        </div>
      ) : (
        <div className="channels-grid-4">
          {filteredChannels.map(channel => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryChannels;
