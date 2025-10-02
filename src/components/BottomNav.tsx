import { Home, Star } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const BottomNav = () => {
  const [location] = useLocation();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
    },
    {
      path: '/favorites',
      icon: Star,
      label: 'Favorites',
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          href={path}
          className={`nav-item ${location === path ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;