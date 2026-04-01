import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-full bg-card/60 backdrop-blur-md border border-border hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-foreground shadow-sm"
      title="Alternar tema"
    >
      {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-sky-600" />}
    </button>
  );
}
