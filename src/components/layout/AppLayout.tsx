import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users, 
  Calendar, 
  BarChart2, 
  Settings, 
  Search, 
  Plus, 
  ChevronRight, 
  Home, 
  FileText, 
  Globe,
  Cloud,
  LogOut,
  User,
  Bell,
  Menu,
  Moon,
  Sun,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: BarChart2, label: 'KPIs', path: '/kpis' },
  { icon: Cloud, label: 'Nube', path: '/notes' },
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Globe, label: 'Eventos', path: '/events' },
  { icon: Calendar, label: 'Agenda', path: '/calendar' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
      <div className="mx-auto max-w-md px-6 pb-12 pt-1 pointer-events-auto">
        <div className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-50 dark:opacity-40 pointer-events-none" />
          <div className="flex justify-between items-center h-16 px-2 relative">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path === '/' && location.pathname === '/contacts');

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "relative flex items-center justify-center rounded-2xl transition-all duration-500 outline-none tap-highlight-transparent group",
                    active ? "flex-[2] bg-primary/15 dark:bg-primary/30" : "flex-1 text-muted-foreground hover:text-foreground/80"
                  )}
                >
                  <motion.div
                    layout
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 w-full h-full"
                  >
                    {/* Animated Indicator Background */}
                    {active && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-primary/5 dark:bg-white/5 rounded-2xl -z-10 border border-primary/20 dark:border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}

                    {/* Icon with Pop effect */}
                    <motion.div
                      animate={{ 
                        scale: active ? 1.1 : 1,
                        rotate: active ? [0, -5, 5, 0] : 0
                      }}
                      transition={{ duration: 0.4 }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      <item.icon 
                        className={cn(
                          "w-5 h-5 transition-colors duration-300",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} 
                        strokeWidth={active ? 2.5 : 2} 
                      />
                    </motion.div>

                    {/* Expandable Label */}
                    <AnimatePresence mode="popLayout">
                      {active && (
                        <motion.span
                          initial={{ opacity: 0, x: -10, width: 0 }}
                          animate={{ opacity: 1, x: 0, width: "auto" }}
                          exit={{ opacity: 0, x: -5, width: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30 
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-primary overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Tiny active dot */}
                  {active && (
                    <motion.div 
                      layoutId="navDot"
                      className="absolute -bottom-1 w-1.5 h-0.5 bg-primary rounded-full shadow-[0_0_10px_#0ea5e9]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
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
  headerAction?: ReactNode;
}

export const AppLayout = ({ children, headerAction }: AppLayoutProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100svh] bg-background flex flex-col overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border transition-colors duration-500 pt-safe">
        <div className="px-5 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            {headerAction}
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
