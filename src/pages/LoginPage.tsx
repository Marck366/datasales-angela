import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

/* ─── Floating Orbs Background ─── */
const orbs = [
  { size: 340, x: '10%', y: '15%', color: 'var(--sky-blue)', delay: 0, duration: 18 },
  { size: 260, x: '75%', y: '10%', color: 'var(--lime)', delay: 2, duration: 22 },
  { size: 200, x: '60%', y: '70%', color: 'var(--navy)', delay: 4, duration: 20 },
  { size: 160, x: '20%', y: '80%', color: 'var(--sky-blue)', delay: 1, duration: 16 },
  { size: 120, x: '85%', y: '50%', color: 'var(--lime)', delay: 3, duration: 24 },
];

const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {orbs.map((orb, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: orb.size,
          height: orb.size,
          left: orb.x,
          top: orb.y,
          background: `radial-gradient(circle, hsl(${orb.color} / 0.25) 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 40, -30, 20, 0],
          y: [0, -50, 20, -30, 0],
          scale: [1, 1.15, 0.9, 1.1, 1],
        }}
        transition={{
          duration: orb.duration,
          delay: orb.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

/* ─── Animated Grid Background ─── */
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.035] dark:opacity-[0.06]">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    {/* Scanning line */}
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
      animate={{ top: ['-5%', '105%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      style={{ opacity: 0.6 }}
    />
  </div>
);

/* ─── Animated text reveal ─── */
const TextReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/* ─── Floating keywords (sustainability) ─── */
const keywords = ['ESG', 'Sostenibilidad', 'Impacto', 'Innovación', 'Futuro', 'Datos', 'Estrategia'];

const FloatingKeywords = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {keywords.map((word, i) => (
      <motion.span
        key={word}
        className="absolute text-[10px] font-heading font-black uppercase tracking-[0.3em] text-primary/[0.06] dark:text-primary/[0.08] select-none"
        style={{
          left: `${10 + (i * 13) % 80}%`,
          top: `${15 + (i * 17) % 70}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 6 + i * 0.5,
          delay: i * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {word}
      </motion.span>
    ))}
  </div>
);

/* ─── 3D Tilt Card ─── */
const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
};

/* ─── Particle burst on login ─── */
const SuccessParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360,
    distance: 60 + Math.random() * 100,
    size: 3 + Math.random() * 4,
    color: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

/* ─── Main LoginPage ─── */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Typewriter for tagline
  const tagline = 'Fricción Cero.';
  const [typedText, setTypedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= tagline.length) {
        setTypedText(tagline.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 90);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Credenciales inválidas. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    } else {
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 800);
    }
  };

  return (
    <div
      className="min-h-[100svh] w-full flex bg-background relative selection:bg-primary/20 overflow-hidden transition-colors duration-500"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ─── Layered backgrounds ─── */}
      <GridBackground />
      <FloatingOrbs />
      <FloatingKeywords />

      {/* Theme toggle */}
      <div className="absolute top-4 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* ─── Left Panel (Hero / Brand) — Desktop ─── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative p-12 overflow-hidden border-r border-border/50 z-10 transition-colors">
        {/* Diagonal accent stripe */}
        <motion.div
          className="absolute -top-20 -left-20 w-[200%] h-40 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent rotate-[-8deg] pointer-events-none"
          animate={{ x: ['-10%', '5%', '-10%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-[10px] font-heading text-primary tracking-[0.5em] uppercase mb-6 font-black flex items-center gap-3"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Ângela Impact Economy
          </motion.p>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.2 }}
          >
            <div className="flex flex-col gap-4 mb-8">
              <motion.img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 object-contain"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="text-6xl xl:text-8xl font-heading font-black text-foreground leading-[1] tracking-tighter">
                <motion.span
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Dat
                </motion.span>
                <motion.span
                  className="text-primary inline-block"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 15 }}
                >
                  â
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-glow"
                >
                  Sales
                </motion.span>
              </div>
            </div>
          </motion.div>

          <div className="text-lg text-muted-foreground font-body max-w-sm leading-relaxed">
            <TextReveal text="La aplicación comercial de" delay={0.7} />
            <span className="block mt-1">
              <motion.span
                className="text-primary font-heading font-black text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {typedText}
                <motion.span
                  className="inline-block w-[2px] h-5 bg-primary ml-0.5 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </motion.span>
            </span>
          </div>

          {/* Animated stats */}
          <motion.div
            className="flex gap-8 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            {[
              { label: 'Pipeline', value: 'Real-time' },
              { label: 'Equipo', value: 'Conectado' },
              { label: 'Impacto', value: 'ESG' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + i * 0.15 }}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black">
                  {stat.label}
                </span>
                <span className="text-sm font-heading font-bold text-foreground">{stat.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="relative z-10 text-[10px] text-muted-foreground/60 font-body uppercase tracking-[0.2em] font-bold"
        >
          © {new Date().getFullYear()} Ângela Impact Economy
        </motion.div>
      </div>

      {/* ─── Right Panel (Login Form) ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
          className="w-full max-w-[400px] relative z-20"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10 overflow-hidden">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-primary flex items-center justify-center gap-2 mx-auto mb-4"
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-accent"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Ângela Impact Economy
            </motion.p>
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <motion.img
                src="/logo.png"
                alt="Logo"
                className="w-14 h-14 object-contain"
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              />
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-heading font-black text-foreground tracking-tighter"
              >
                Dat<span className="text-primary">â</span>Sales
              </motion.h1>
            </div>
          </div>

          {/* Login Form Card with 3D Tilt */}
          <TiltCard className="relative">
            <AnimatePresence>
              {showSuccess && <SuccessParticles />}
            </AnimatePresence>

            <form
              onSubmit={handleSubmit}
              className="glass-panel bg-card/50 dark:bg-card/30 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 md:p-10 border border-white/30 dark:border-white/[0.06] relative overflow-hidden transition-all duration-500"
            >
              {/* Animated glow on top of card */}
              <motion.div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-3/4 h-[2px] rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)), transparent)',
                }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Background glow blob inside card */}
              <motion.div
                className="absolute top-0 right-0 w-40 h-40 rounded-full -z-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.3, 1], x: [0, 10, 0], y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="font-heading font-bold text-2xl text-foreground mb-1 tracking-tight">
                  Bienvenido de nuevo
                </h2>
                <p className="text-sm text-muted-foreground font-body">Inicia sesión en tu cuenta</p>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs text-center text-destructive font-bold uppercase tracking-wide overflow-hidden"
                  >
                    <motion.span
                      animate={{ x: [0, -3, 3, -2, 2, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {error}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                {/* Email field */}
                <motion.div
                  className="space-y-2 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-4">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="ejemplo@angelaie.com"
                      className="w-full px-6 py-4 bg-background/50 dark:bg-background/20 border border-border rounded-full text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/30 shadow-sm"
                      required
                    />
                    <AnimatePresence>
                      {focusedField === 'email' && (
                        <motion.div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            boxShadow: '0 0 20px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.05)',
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Password field */}
                <motion.div
                  className="space-y-2 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-4">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-background/50 dark:bg-background/20 border border-border rounded-full text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/30 shadow-sm"
                      required
                    />
                    <AnimatePresence>
                      {focusedField === 'password' && (
                        <motion.div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            boxShadow: '0 0 20px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.05)',
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Submit button with shimmer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-6 bg-primary text-primary-foreground font-heading font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_12px_24px_-8px_hsl(var(--primary)/0.4)] hover:shadow-[0_20px_40px_-12px_hsl(var(--primary)/0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                    />
                    <span className="relative z-10">
                      {isLoading ? (
                        <motion.span
                          className="flex items-center justify-center gap-2"
                          animate={{ opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <motion.span
                            className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full inline-block"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          />
                          Validando...
                        </motion.span>
                      ) : (
                        'Acceder al CRM'
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              </div>

              <motion.p
                className="text-[10px] text-muted-foreground font-body text-center mt-10 uppercase tracking-widest font-bold opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.2 }}
              >
                Soporte: it@angelaie.com
              </motion.p>
            </form>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
