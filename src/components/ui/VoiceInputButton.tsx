import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Define types for Web Speech API to avoid 'any'
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export const VoiceInputButton = ({ onTranscript, className, size = 'md' }: VoiceInputButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isSecure, setIsSecure] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastFinalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Comprobar contexto seguro (HTTPS)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsSecure(false);
    }

    // Detección robusta de prefijos
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      setIsListening(true);
      lastFinalTranscriptRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const newText = finalTranscript.slice(lastFinalTranscriptRef.current.length).trim();
        if (newText) {
          onTranscript(newText);
          lastFinalTranscriptRef.current = finalTranscript;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        toast({ title: 'Permiso denegado', description: 'Permite el acceso al micrófono en los ajustes de tu navegador.', variant: 'destructive' });
      } else if (event.error !== 'no-speech') {
        toast({ title: 'Aviso de voz', description: `Inconveniente detectado: ${event.error}`, variant: 'destructive' });
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSecure) {
      toast({ 
        title: '🔑 Conexión no segura', 
        description: 'Por seguridad, el dictado requiere HTTPS. Pruébalo en producción o localhost.',
        variant: 'destructive'
      });
      return;
    }

    if (!isSupported) {
      toast({ 
        title: 'No compatible', 
        description: 'Tu navegador no soporta esta función. Prueba con Safari (iOS), Chrome o Samsung Internet.',
        variant: 'destructive'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setIsListening(false);
        try {
          recognitionRef.current?.abort();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (retryError) {
              console.error('Failed to restart recognition after abort', retryError);
            }
          }, 100);
        } catch (abortError) {
          console.error('Critical voice failure:', abortError);
        }
      }
    }
  };

  const getStatusInfo = () => {
    if (!isSecure) return "Capa de seguridad necesaria (HTTPS)";
    if (!isSupported) return "Navegador no compatible con voz";
    return isListening ? "Escuchando... (pulsa para parar)" : "Dictar nota";
  };

  if (!isSupported || !isSecure) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleListening();
        }}
        className={cn(
          "p-2.5 rounded-xl border border-border/30 bg-secondary/50 text-muted-foreground/30 transition-all active:scale-95",
          className
        )}
        title={getStatusInfo()}
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  const iconSizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const buttonSizes = { sm: 'p-1.5 rounded-lg', md: 'p-2.5 rounded-xl', lg: 'p-3 rounded-2xl' };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleListening();
      }}
      className={cn(
        "relative transition-all duration-300 flex items-center justify-center overflow-hidden active:scale-95 group",
        buttonSizes[size],
        isListening 
          ? "bg-destructive text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110" 
          : "bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/30",
        className
      )}
      title={getStatusInfo()}
    >
      {isListening ? (
        <>
          <span className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full border-2 border-white/30 rounded-full animate-ping opacity-25" />
          </div>
          <Mic className={cn(iconSizes[size], "relative z-10")} />
        </>
      ) : (
        <Mic className={cn(iconSizes[size])} />
      )}
    </button>
  );
};
