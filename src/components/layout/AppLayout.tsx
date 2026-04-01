import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  BarChart2, 
  Settings, 
  Search, 
  Plus, 
  ChevronRight, 
  Home, 
  FileText, 
  Globe 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: FileText, label: 'Notas', path: '/notes' },
  { icon: BarChart2, label: 'KPIs', path: '/kpis' },
  { icon: Globe, label: 'Eventos', path: '/events' },
  { icon: Calendar, label: 'Agenda', path: '/calendar' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
      <div className="mx-auto max-w-lg px-4 pb-6 pt-1 pointer-events-auto">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path === '/' && location.pathname === '/contacts');

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-2xl transition-all duration-300 ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-x-2 inset-y-0.5 bg-muted rounded-2xl -z-0"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="w-5 h-5 relative z-10" strokeWidth={active ? 2.5 : 1.8} />
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.15em] relative z-10",
                    active ? "opacity-100" : "opacity-60"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Logo = () => (
  <div className="flex items-center gap-2">
    <img src="/logo.png" alt="DatâSales Logo" className="w-9 h-9 object-contain" />
    <span className="font-heading font-black text-xl tracking-tighter text-foreground">
      Dat<span className="text-sky">â</span>Sales
    </span>
  </div>
);

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100svh] bg-background flex flex-col overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border transition-colors duration-500 pt-safe">
        <div className="px-5 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-muted border border-border ml-1 shadow-sm hover:translate-y-[-2px] transition-all cursor-pointer overflow-hidden"
              title="Mi perfil"
            >
              <span className="text-sm font-black text-foreground">{profile?.name?.[0]?.toUpperCase() || 'U'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  );
};
