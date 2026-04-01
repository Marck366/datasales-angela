import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[100svh] w-full flex bg-background relative selection:bg-primary/20 overflow-hidden transition-colors duration-500" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* ─── FONDO DINÁMICO (Gradiente centrado, sin tocar la barra superior) ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[-20%] w-[70%] h-[70%] bg-primary/15 dark:bg-primary/25 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-primary/8 dark:bg-primary/15 blur-[120px] rounded-full" />
      </div>

      <div className="absolute top-4 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* ─── Contenedor Izquierdo (Hero / Brand) ─── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative p-12 overflow-hidden border-r border-border bg-muted/30 backdrop-blur-[2px] z-10 transition-colors">
        <div className="relative z-10">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] font-heading text-primary tracking-[0.5em] uppercase mb-6 font-black flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Ângela Impact Economy
          </motion.p>
        </div>
        
        <div className="relative z-10 w-full max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <div className="flex flex-col gap-4 mb-8">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              <div className="text-6xl xl:text-8xl font-heading font-black text-foreground leading-[1] tracking-tighter shadow-primary/10 drop-shadow-sm">
                Dat<span className="text-primary">â</span><br/>Sales
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground font-body max-w-sm leading-relaxed"
          >
            La aplicación comercial de Fricción Cero. Controla tu pipeline, equipo y resultados en un solo lugar.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 text-[10px] text-muted-foreground/60 font-body uppercase tracking-[0.2em] font-bold"
        >
          © {new Date().getFullYear()} Ângela Impact Economy
        </motion.div>
      </div>

      {/* ─── Contenedor Derecho (Login Form) ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden z-10">
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
           className="w-full max-w-[380px] relative z-20"
        >
          {/* Mobile Header elements */}
          <div className="lg:hidden text-center mb-10 overflow-hidden">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-primary flex items-center justify-center gap-2 mx-auto mb-4"
            >
               <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
               Ângela Impact Economy
            </motion.p>
            <div className="flex flex-col items-center justify-center gap-4 mb-8">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-heading font-black text-foreground tracking-tighter"
              >
                Dat<span className="text-primary">â</span>Sales
              </motion.h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel bg-card/40 dark:bg-card/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-2xl rounded-[2.5rem] p-8 md:p-10 border border-white/40 dark:border-white/5 relative overflow-hidden transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="mb-8">
              <h2 className="font-heading font-bold text-2xl text-foreground mb-1 tracking-tight">Bienvenido de nuevo</h2>
              <p className="text-sm text-muted-foreground font-body">Inicia sesión en tu cuenta</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs text-center text-destructive font-bold uppercase tracking-wide">
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-4">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@angelaie.com"
                  className="w-full px-6 py-4 bg-background/50 dark:bg-background/20 border border-border rounded-full text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/30 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-4">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-background/50 dark:bg-background/20 border border-border rounded-full text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/30 shadow-sm"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-6 bg-primary text-primary-foreground font-heading font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_12px_24px_-8px_hsl(var(--primary)/0.4)] hover:shadow-[0_16px_32px_-12px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10">{isLoading ? 'Validando...' : 'Acceder al CRM'}</span>
              </button>
            </div>
            
            <p className="text-[10px] text-muted-foreground font-body text-center mt-10 uppercase tracking-widest font-bold opacity-60">
              Soporte: it@angelaie.com
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
