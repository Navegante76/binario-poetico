import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-background"
    >
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#DC2626]">
            Erro 404
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
            Página não encontrada
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A página que procura não existe ou foi movida. Utilize o botão abaixo
            para voltar à página inicial.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-[#ef4444]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </a>
        </div>
      </div>
    </motion.div>
  );
}
