import { Tv, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="app-header header-animate">
      <div className="logo-section animate-fade-in">
        <Tv size={24} className="text-accent hover-glow animate-pulse" />
        <span className="animate-slide-in-left">Live TV Pro</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="theme-toggle p-2 rounded-lg"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="animate-scale-in" />
          ) : (
            <Moon size={20} className="animate-scale-in" />
          )}
        </button>
        <button 
          className="menu-btn hover-scale animate-fade-in"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;