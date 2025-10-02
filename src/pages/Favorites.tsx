// /src/pages/Favorites.tsx
import { useFavorites } from '@/contexts/FavoritesContext';
import ChannelCard from '@/components/ChannelCard';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Favorites = () => {
  const { favorites, removeFavorite } = useFavorites();

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
      favorites.forEach(channel => removeFavorite(channel.id));
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={48} className="text-text-secondary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Favorite Channels</h2>
        <p className="text-text-secondary mb-6">
          Start adding channels to your favorites by clicking the star icon on any channel.
        </p>
        <Alert>
          <Heart className="h-4 w-4" />
          <AlertDescription>
            Your favorite channels will be saved locally and persist between sessions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart size={24} className="text-red-500" />
            Favorite Channels
          </h1>
          <p className="text-text-secondary">
            {favorites.length} channel{favorites.length !== 1 ? 's' : ''} in your favorites
          </p>
        </div>
        
        {favorites.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
            Clear All
          </Button>
        )}
      </div>

      <div className="channels-grid-4">
        {favorites
          .sort((a, b) => b.addedAt - a.addedAt)
          .map(channel => (
            <ChannelCard 
              key={channel.id} 
              channel={{
                ...channel,
                categoryId: ''
              }} 
            />
          ))}
      </div>
    </div>
  );
};

export default Favorites;
