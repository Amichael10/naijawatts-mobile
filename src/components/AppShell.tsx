import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calculator, Clock, ChevronLeft } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/calculate', icon: Calculator, label: 'Calculate' },
  { path: '/history', icon: Clock, label: 'History' },
];

export default function AppShell({ children, title, showBack }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-container bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md safe-top">
        <div className="flex items-center justify-between px-5 py-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-muted-foreground font-body text-sm active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          ) : (
            <div />
          )}
          <h1 className="font-display font-extrabold text-xl text-primary">
            {title || 'NaijaWatts ⚡'}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <main className="screen-padding pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav z-40">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-display font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
