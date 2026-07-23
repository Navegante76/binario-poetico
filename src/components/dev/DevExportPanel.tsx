import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { Check, Download, FileCode, FileImage, FolderArchive, HardDrive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevAuth } from "@/lib/dev-auth";

interface DevExportPanelProps {
  open: boolean;
  onClose: () => void;
}

type Category = "code" | "asset" | "config";

interface FileEntry {
  path: string;
  content: string;
  category: Category;
}

const ROOT_FILES = [
  "package.json",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "eslint.config.js",
  "tailwind.config.ts",
  "components.json",
  "index.html",
  "README.md",
];

function useProjectFiles() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const entries: FileEntry[] = [];

      const codeModules = import.meta.glob("../../**/*", {
        query: "?raw",
        import: "default",
        eager: true,
      }) as Record<string, string>;

      for (const [relativePath, content] of Object.entries(codeModules)) {
        if (typeof content !== "string") continue;
        entries.push({ path: relativePath.replace("../../", "src/"), content, category: "code" });
      }

      const assetModules = import.meta.glob("../../../public/**/*", {
        query: "?raw",
        import: "default",
        eager: true,
      }) as Record<string, string>;

      for (const [relativePath, content] of Object.entries(assetModules)) {
        if (typeof content !== "string") continue;
        entries.push({ path: relativePath.replace("../../../public/", "public/"), content, category: "asset" });
      }

      for (const file of ROOT_FILES) {
        try {
          const mod = (await import(`../../../${file}?raw`)) as { default: string };
          if (mod.default) entries.push({ path: file, content: mod.default, category: "config" });
        } catch {
          // ignore missing files
        }
      }

      entries.sort((a, b) => a.path.localeCompare(b.path));
      setFiles(entries);
      setLoading(false);
    };

    load();
  }, []);

  return { files, loading };
}

export function DevExportPanel({ open, onClose }: DevExportPanelProps) {
  const { devRole } = useDevAuth();
  const { files, loading } = useProjectFiles();
  const [selected, setSelected] = useState<Record<Category, boolean>>({
    code: true,
    asset: true,
    config: true,
  });
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFiles = useMemo(() => files.filter((f) => selected[f.category]), [files, selected]);

  const stats = useMemo(() => {
    return {
      code: files.filter((f) => f.category === "code").length,
      asset: files.filter((f) => f.category === "asset").length,
      config: files.filter((f) => f.category === "config").length,
      totalSize: filteredFiles.reduce((acc, f) => acc + f.content.length, 0),
    };
  }, [files, filteredFiles]);

  const handleExport = async () => {
    if (filteredFiles.length === 0) return;
    setExporting(true);
    const zip = new JSZip();
    for (const file of filteredFiles) zip.file(file.path, file.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `binario-poetico-export-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExporting(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const toggleCategory = (category: Category) => {
    setSelected((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.aside initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 260 }} className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-md flex-col border-l border-border/40 bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626]/15 ring-1 ring-[#DC2626]/30">
                  <FolderArchive className="h-5 w-5 text-[#DC2626]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Exportar Projeto</h3>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Apenas Desenvolvedor</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {devRole !== "developer" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  Esta funcionalidade é exclusiva do cargo Desenvolvedor.
                </div>
              )}
              <p className="text-sm text-muted-foreground">Gera um ficheiro ZIP com o código, assets e configurações do projeto.</p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Categorias</p>
                <button type="button" onClick={() => toggleCategory("code")} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected.code ? "border-[#DC2626]/30 bg-[#DC2626]/5" : "border-border/40 bg-background"}`}>
                  <FileCode className="h-5 w-5 text-[#DC2626]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Código fonte</p>
                    <p className="text-[10px] text-muted-foreground">{stats.code} ficheiros em src/</p>
                  </div>
                  {selected.code && <Check className="h-4 w-4 text-green-600" />}
                </button>
                <button type="button" onClick={() => toggleCategory("asset")} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected.asset ? "border-[#DC2626]/30 bg-[#DC2626]/5" : "border-border/40 bg-background"}`}>
                  <FileImage className="h-5 w-5 text-[#DC2626]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Assets públicos</p>
                    <p className="text-[10px] text-muted-foreground">{stats.asset} ficheiros em public/</p>
                  </div>
                  {selected.asset && <Check className="h-4 w-4 text-green-600" />}
                </button>
                <button type="button" onClick={() => toggleCategory("config")} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected.config ? "border-[#DC2626]/30 bg-[#DC2626]/5" : "border-border/40 bg-background"}`}>
                  <HardDrive className="h-5 w-5 text-[#DC2626]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Configurações</p>
                    <p className="text-[10px] text-muted-foreground">package.json, vite.config.ts, etc.</p>
                  </div>
                  {selected.config && <Check className="h-4 w-4 text-green-600" />}
                </button>
              </div>

              <div className="rounded-xl border border-border/40 bg-secondary/30 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Resumo</p>
                <div className="mt-1 flex items-center gap-4 text-sm">
                  <span className="text-foreground font-semibold">{filteredFiles.length} ficheiros</span>
                  <span className="text-muted-foreground">~{(stats.totalSize / 1024).toFixed(0)} KB</span>
                </div>
              </div>

              {loading && <p className="text-sm text-muted-foreground">A carregar lista de ficheiros...</p>}
            </div>

            <div className="border-t border-border/40 bg-secondary/20 px-5 py-4">
              <Button type="button" onClick={handleExport} disabled={loading || exporting || filteredFiles.length === 0 || devRole !== "developer"} className="h-10 w-full rounded-md bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#ef4444] disabled:opacity-50">
                {exporting ? "A gerar ZIP..." : done ? <><Check className="mr-2 h-4 w-4" /> Download iniciado</> : <><Download className="mr-2 h-4 w-4" /> Descarregar ZIP</>}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
