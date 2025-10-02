// /src/components/ChannelCard.tsx
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { PublicChannel } from '@/types';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRecents } from '@/contexts/RecentsContext';

interface ChannelCardProps {
  channel: PublicChannel;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addRecent } = useRecents();
  const isChannelFavorite = isFavorite(channel.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isChannelFavorite) {
      removeFavorite(channel.id);
    } else {
      addFavorite(channel);
    }
  };

  const handleChannelClick = () => {
    // Add to recent channels when clicked
    addRecent(channel);
  };

  return (
    <Link 
      to={`/channel/${encodeURIComponent(channel.id)}`} 
      className="channel-card hover-lift animate-fade-in"
      onClick={handleChannelClick}
    >
      <div className="channel-thumbnail">
        <img
          src={channel.logoUrl}
          alt={`${channel.name} logo`}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        <div className="play-overlay">
          <div className="play-btn-overlay hover-scale">
            <Play size={20} fill="white" />
          </div>
        </div>
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 hover-scale ${
            isChannelFavorite
              ? 'bg-yellow-500 text-white animate-bounce'
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          aria-label={isChannelFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={14} fill={isChannelFavorite ? 'white' : 'none'} />
        </button>
      </div>
      <div className="channel-info">
        <div className="channel-name">{channel.name}</div>
        <div className="channel-category">{channel.categoryName}</div>
      </div>
    </Link>
  );
};

export default ChannelCard;
