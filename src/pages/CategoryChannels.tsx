// /src/pages/CategoryChannels.tsx
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChannels, setFilteredChannels] = useState<PublicChannel[]>([]);
  // FIX: Add missing states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndChannels();
    }
  }, [slug]);

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

  const parseM3U = (m3uContent: string, categoryId: string, categoryName: string): PublicChannel[] => {
    const lines = m3uContent.split('\n').map(line => line.trim()).filter(line => line);
    const channels: PublicChannel[] = [];
    let currentChannel: Partial<PublicChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTINF:')) {
        // Extract channel name (after the comma)
        const nameMatch = line.match(/,(.+)$/);
        const channelName = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';

        // Extract logo URL from tvg-logo attribute
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const logoUrl = logoMatch ? logoMatch[1] : '/placeholder.svg';

        currentChannel = {
          name: channelName,
          logoUrl: logoUrl,
          categoryId,
          categoryName,
        };
      } else if (line && !line.startsWith('#') && currentChannel.name) {
        // Create consistent ID format for M3U channels
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

  const fetchCategoryAndChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching for slug:', slug); // DEBUG

      // Find the category by slug
      const categoriesRef = collection(db, 'categories');
      const categoryQuery = query(categoriesRef, where('slug', '==', slug));
      const categorySnapshot = await getDocs(categoryQuery);

      if (categorySnapshot.empty) {
        setError('Category not found');
        setLoading(false);
        console.log('No category found'); // DEBUG
        return;
      }

      const categoryDoc = categorySnapshot.docs[0];
      const categoryData = { id: categoryDoc.id, ...categoryDoc.data() } as Category;
      setCategory(categoryData);
      console.log('Category loaded:', categoryData); // DEBUG

      let allChannels: PublicChannel[] = [];

      // If category has M3U URL, fetch and parse it to get channels
      if (categoryData.m3uUrl) {
        console.log('Fetching M3U from:', categoryData.m3uUrl); // DEBUG
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
      } else {
        console.log('No m3uUrl in category - skipping M3U fetch'); // DEBUG
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
        console.log(`Loaded ${manualChannels.length} manual channels`); // DEBUG
      } catch (firestoreError) {
        console.error('Error fetching manual channels:', firestoreError);
      }

      console.log(`Total channels loaded: ${allChannels.length}`);
      setChannels(allChannels);

    } catch (error) {
      console.error('Error fetching category and channels:', error);
      setError('Failed to load channels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-full" />
        {/* FIX: Use standard Tailwind grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Category not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Back Button at top left */}
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
        <p className="text-muted-foreground"> {/* FIX: Standard shadcn class */}
          {channels.length} channel{channels.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2" {/* FIX: Standard input styles */}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        )}
      </div>

      {filteredChannels.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <Search size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No channels found</h3>
          <p className="text-muted-foreground">
            No channels match "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12">
          <Tv size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Channels Available</h3>
          <p className="text-muted-foreground">
            No channels have been added to this category yet. Add an `m3uUrl` to the category or manual channels in Firestore.
          </p>
          <Button onClick={() => setLocation('/admin')} className="mt-4">Go to Admin</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {/* FIX: Standard Tailwind */}
          {filteredChannels.map(channel => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryChannels;
