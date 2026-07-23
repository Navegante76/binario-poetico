import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, User, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContent, useDevAuth } from "@/lib/dev-auth";

interface DevLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function DevLoginModal({ open, onClose }: DevLoginModalProps) {
  const { login } = useDevAuth();
  const { content } = useContent();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(name, password);
    if (success) {
      setName("");
      setPassword("");
      onClose();
    } else {
      setError("Nome ou palavra-passe incorretos.");
      setPassword("");
    }
  };

  const dialog = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC2626]/15 ring-1 ring-[#DC2626]/30">
                    <Wrench className="h-5 w-5 text-[#DC2626]" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">Acesso Dev</h2>
                    <p className="text-xs text-white/50">
                      {content.navbar.brandName} · Modo de Edição
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/25 focus-visible:ring-[#DC2626]"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Palavra-passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-white/25 focus-visible:ring-[#DC2626]"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                    aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#DC2626] text-sm font-semibold text-white shadow-lg shadow-red-900/25 hover:bg-[#ef4444] transition-all"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}
