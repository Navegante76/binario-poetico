import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDevAuth } from "@/lib/dev-auth";

export default function DevLogin() {
  const { login, isDevAuthenticated } = useDevAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Already authenticated → redirect to home
  if (isDevAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(name, password);
    if (success) {
      navigate("/", { replace: true });
    } else {
      setError("Nome ou palavra-passe incorretos.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-5">
      {/* Background accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/4 h-72 w-72 rounded-full bg-[#DC2626]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/30">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DC2626]/15 ring-1 ring-[#DC2626]/30">
              <Wrench className="h-7 w-7 text-[#DC2626]" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Acesso Desenvolvedor
            </CardTitle>
            <CardDescription className="text-white/60">
              Área reservada à gestão do website Binário Poético
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {/* Name field */}
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:ring-[#DC2626]"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password field */}
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Palavra-passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 pr-11 text-white placeholder:text-white/30 focus-visible:ring-[#DC2626]"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 text-center"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#DC2626] text-white font-semibold shadow-lg shadow-red-900/30 hover:bg-[#ef4444] transition-all"
              >
                <Lock className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </CardContent>
          </form>

          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-white/30">
              Acesso exclusivo para desenvolvimento · Binário Poético © {new Date().getFullYear()}
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
