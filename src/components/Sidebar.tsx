import { X, Home, Star, Settings, Shield, Tv } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();

  const menuItems = [
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="p-4 border-b border-border">
          <div className="sidebar-header-animate flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv size={24} className="text-accent animate-pulse" />
              <span className="text-xl font-bold animate-fade-in">Live TV Pro</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-all duration-300 hover-scale"
              aria-label="Close sidebar"
            >
              <X size={20} className="animate-scale-in" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <Link
                  href={path}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    location === path
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-border">
          <div className="text-xs text-text-secondary">
            <div>Live TV Pro</div>
            <div>Version 1.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;