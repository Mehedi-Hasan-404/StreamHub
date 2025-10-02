// /src/components/CategoryCard.tsx
import { Link } from 'wouter';
import { Category } from '@/types';
import { Tv } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link href={`/category/${category.slug}`} className="category-card hover-lift animate-fade-in">
      <div className="category-icon hover-scale">
        {category.iconUrl ? (
          <img 
            src={category.iconUrl} 
            alt={category.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <Tv size={24} />
        )}
        <Tv size={24} className="hidden" />
      </div>
      <span className="category-name">{category.name}</span>
    </Link>
  );
};

export default CategoryCard;
