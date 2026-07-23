import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileSpreadsheet,
  FileText,
  Inbox,
  List,
  Mail,
  MailCheck,
  MailPlus,
  MessageSquare,
  Phone,
  Search,
  Send,
  StickyNote,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  buildSubmissionMailto,
  dayKey,
  formatAbsoluteDateTime,
  formatDateLong,
  formatRelativeTime,
  useSubmissions,
  type Submission,
  type SubmissionStatus,
} from "@/lib/form-submissions";
import { toast } from "sonner";

interface SubmissionsPanelProps {
  open: boolean;
  onClose: () => void;
}

// Email de destino para respostas — alterado para o identificador do projecto.
const RECIPIENT_EMAIL = "NV76_hub";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "Novo",
  read: "Lido",
  archived: "Arquivado",
};

const STATUS_BADGE: Record<SubmissionStatus, string> = {
  new: "bg-[#DC2626] text-white",
  read: "bg-secondary text-foreground",
  archived: "bg-secondary/60 text-muted-foreground",
};

const FILTER_TABS: Array<{
  key: SubmissionStatus | "all";
  label: string;
}> = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Novos" },
  { key: "read", label: "Lidos" },
  { key: "archived", label: "Arquiv." },
];

type ViewMode = "list" | "calendar";

// ============================================================
// Export helpers — zero dependencies
// ============================================================

function escapeHtml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmtDatePT(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtTimePT(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildCsv(rows: Submission[]): string {
  const headers = [
    "Dia",
    "Hora",
    "Nome",
    "Telefone",
    "Email",
    "Viatura",
    "Modelo",
    "Problema",
    "Quem atendeu",
    "Estado",
  ];
  const body = rows
    .map((s) => {
      const q = (v: unknown) =>
        `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      return [
        fmtDatePT(s.timestamp),
        fmtTimePT(s.timestamp),
        q(s.name),
        q(s.phone),
        q(s.email),
        q(s.marca),
        q(s.modelo),
        q(s.mensagem),
        q(s.assignedTo ?? ""),
        q(STATUS_LABELS[s.status]),
      ].join(";");
    })
    .join("\n");
  return "\uFEFF" + headers.join(";") + "\n" + body;
}

function buildDocHtml(rows: Submission[]): string {
  const header = ["Dia", "Hora", "Nome", "Telefone", "Email", "Viatura", "Modelo", "Problema", "Quem atendeu", "Estado"]
    .map((h) => `<th style="background:#f2f2f2;text-align:left;padding:6px 9px;font-family:Arial,sans-serif;font-size:12px;border:1px solid #bbb">${escapeHtml(h)}</th>`)
    .join("");

  const style = 'font-family:Arial,sans-serif;font-size:12px;padding:6px 9px;border:1px solid #bbb;vertical-align:top';
  const body = rows
    .map((s) => {
      const cells = [
        fmtDatePT(s.timestamp),
        fmtTimePT(s.timestamp),
        s.name,
        s.phone,
        s.email,
        s.marca,
        s.modelo,
        s.mensagem,
        s.assignedTo || "",
        STATUS_LABELS[s.status],
      ]
        .map((c) => `<td style="${style}">${escapeHtml(String(c ?? ""))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return (
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8" /></head>' +
    '<body><table style="border-collapse:collapse;width:100%">' +
    `<thead><tr>${header}</tr></thead>` +
    `<tbody>${body}</tbody></table></body></html>`
  );
}

function exportCsv(rows: Submission[]) {
  downloadBlob(
    new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" }),
    `pedidos-${todayDateStr()}.csv`,
  );
  toast.success(`Exportadas ${rows.length} linhas para CSV (Excel).`);
}

function exportDoc(rows: Submission[]) {
  downloadBlob(
    new Blob([buildDocHtml(rows)], { type: "application/msword" }),
    `pedidos-${todayDateStr()}.doc`,
  );
  toast.success(`Exportadas ${rows.length} linhas para Word (.doc).`);
}

// ============================================================
// Calendar helpers
// ============================================================

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildCalendarGrid(monthAnchor: Date): Array<{
  date: Date;
  inMonth: boolean;
}> {
  const first = startOfMonth(monthAnchor);
  const startWeekday = first.getDay();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(first);
    d.setDate(d.getDate() - (i + 1));
    cells.push({ date: d, inMonth: false });
  }
  const daysInMonth = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth() + 1,
    0,
  ).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      date: new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), i),
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// Panel
// ============================================================

export function SubmissionsPanel({ open, onClose }: SubmissionsPanelProps) {
  const {
    isAdmin,
    submissions,
    newCount,
    total,
    save,
    remove,
    updateStatus,
    updateNotes,
    assign,
    markAllRead,
    clearAll,
  } = useSubmissions();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(new Date());
  const [calendarDay, setCalendarDay] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const counts = useMemo(
    () => ({
      all: total,
      new: newCount,
      read: submissions.filter((s) => s.status === "read").length,
      archived: submissions.filter((s) => s.status === "archived").length,
    }),
    [submissions, total, newCount],
  );

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (calendarDay && dayKey(s.timestamp) !== calendarDay) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay =
          `${s.name} ${s.email} ${s.phone} ${s.marca} ${s.modelo} ${s.mensagem} ${s.assignedTo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, filter, calendarDay, query]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, Submission[]>();
    for (const s of filtered) {
      const k = dayKey(s.timestamp);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const dayCountsByMonthKey = useMemo(() => {
    const gridKeys = buildCalendarGrid(calendarAnchor).map((c) => dayKey(c.date.getTime()));
    const counts: Record<string, number> = {};
    for (const s of submissions) {
      const k = dayKey(s.timestamp);
      if (gridKeys.includes(k)) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [submissions, calendarAnchor]);

  const handleOpenEmail = (s: Submission) => {
    const href = buildSubmissionMailto(s, RECIPIENT_EMAIL);
    window.open(href, "_blank", "noopener,noreferrer");
    if (s.status === "new") updateStatus(s.id, "read").catch(() => {});
  };

  const handleSeedExample = () => {
    save({
      name: "Exemplo · Cliente Teste",
      phone: "912 345 678",
      email: "exemplo@dominio.pt",
      marca: "Renault",
      modelo: "Clio",
      mensagem:
        "Exemplo de mensagem para mostrar como aparece o painel. Substitua pelos pedidos reais dos clientes.",
      source: "demo",
    }).catch(() => {});
  };

  const dialog = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-md flex-col border-l border-border/40 bg-card shadow-2xl"
            aria-label="Painel de pedidos de orçamento"
          >
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="relative">
                  <Inbox className="h-5 w-5 text-[#DC2626]" />
                  {newCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[9px] font-bold text-white">
                      {newCount}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    Pedidos de Orçamento
                  </h3>
                  <p
                    className="truncate text-[10px] font-mono text-muted-foreground"
                    title="NV76_hub"
                  >
                    criado por NV76_hub
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* View-mode toggle */}
                <div
                  role="tablist"
                  aria-label="Modo de visualização"
                  className="flex items-center gap-0.5 rounded-full border border-border/40 bg-secondary/40 p-0.5"
                >
                  <button
                    role="tab"
                    aria-selected={viewMode === "list"}
                    title="Vista em lista agrupada por dia"
                    onClick={() => setViewMode("list")}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      viewMode === "list"
                        ? "bg-[#DC2626] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    role="tab"
                    aria-selected={viewMode === "calendar"}
                    title="Vista em calendário"
                    onClick={() => setViewMode("calendar")}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      viewMode === "calendar"
                        ? "bg-[#DC2626] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ===== Toolbar ===== */}
            <div className="border-b border-border/40 px-5 py-3 space-y-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar por nome, email, viatura…"
                  className="h-9 rounded-md border-border/40 bg-background pl-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {FILTER_TABS.map(({ key, label }) => {
                  const count = counts[key];
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                        active
                          ? "bg-[#DC2626] text-white"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono ${
                          active
                            ? "bg-white/25 text-white"
                            : "bg-background text-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => filtered.length > 0 && exportCsv(filtered)}
                    disabled={filtered.length === 0}
                    title={
                      filtered.length === 0
                        ? "Sem dados para exportar"
                        : `Baixar ${filtered.length} linha(s) em Excel/CSV`
                    }
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileSpreadsheet className="h-3 w-3" /> Excel
                  </button>
                  <button
                    onClick={() => filtered.length > 0 && exportDoc(filtered)}
                    disabled={filtered.length === 0}
                    title={
                      filtered.length === 0
                        ? "Sem dados para exportar"
                        : `Baixar ${filtered.length} linha(s) em Word/.doc`
                    }
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileText className="h-3 w-3" /> Word
                  </button>
                  {calendarDay && (
                    <button
                      onClick={() => setCalendarDay(null)}
                      title="Limpar filtro de dia"
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary px-2 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary/70 transition-colors"
                    >
                      <X className="h-3 w-3" /> Dia
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {newCount > 0 && (
                    <button
                      onClick={() => markAllRead().catch(() => {})}
                      title="Marcar todos como lidos"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      aria-label="Marcar todos como lidos"
                    >
                      <MailCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {total > 0 && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Apagar TODOS os ${total} pedidos? Esta ação é irreversível.`,
                          )
                        ) {
                          clearAll().catch(() => {});
                        }
                      }}
                      title="Apagar todos os pedidos"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      aria-label="Apagar todos"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ===== Body ===== */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isAdmin && filtered.length === 0 && submissions.length === 0 && (
                <div className="mt-12 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                  <Inbox className="h-10 w-10 text-muted-foreground/40" />
                  <p>Nenhum pedido recebido ainda.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSeedExample}
                    className="border-border/40 bg-background text-xs hover:bg-secondary"
                  >
                    Criar pedido de exemplo
                  </Button>
                </div>
              )}

              {isAdmin && submissions.length > 0 && filtered.length === 0 && (
                <div className="mt-12 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                  <p>Nenhum pedido corresponde à pesquisa ou filtros atuais.</p>
                </div>
              )}

              {/* === LIST VIEW === */}
              {isAdmin && viewMode === "list" && filtered.length > 0 && (
                <div className="space-y-4">
                  {groupedByDay.map(([day, items]) => (
                    <DayGroup
                      key={day}
                      day={day}
                      count={items.length}
                      submissions={items}
                      expandedId={expandedId}
                      onToggleExpand={(id) =>
                        setExpandedId((cur) => (cur === id ? null : id))
                      }
                      onSend={handleOpenEmail}
                      onToggleStatus={(id, status) =>
                        updateStatus(id, status).catch(() => {})
                      }
                      onToggleArchive={(id, status) =>
                        updateStatus(id, status).catch(() => {})
                      }
                      onDelete={(id) => {
                        const sub = items.find((s) => s.id === id);
                        if (
                          window.confirm(
                            `Apagar pedido de ${sub?.name ?? "…"}?`,
                          )
                        ) {
                          remove(id).catch(() => {});
                        }
                      }}
                      onNotes={(id, notes) =>
                        updateNotes(id, notes).catch(() => {})
                      }
                      onAssign={(id, assignedTo) =>
                        assign(id, assignedTo).catch(() => {})
                      }
                    />
                  ))}
                </div>
              )}

              {/* === CALENDAR VIEW === */}
              {isAdmin && viewMode === "calendar" && (
                <CalendarView
                  monthAnchor={calendarAnchor}
                  dayCounts={dayCountsByMonthKey}
                  selectedDay={calendarDay}
                  onAnchorChange={setCalendarAnchor}
                  onSelectDay={(k) => {
                    setCalendarDay(k);
                    setViewMode("list");
                  }}
                />
              )}
            </div>

            <div className="border-t border-border/40 px-5 py-3 text-[11px] text-muted-foreground">
              Os pedidos são guardados na Cloud (Convex). Clica em
              <span className="mx-1 inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                <Send className="h-3 w-3" /> Enviar
              </span>
              para abrir o cliente de correio pré-preenchido, ou em
              <span className="mx-1 inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                <UserCheck className="h-3 w-3" /> Atender
              </span>
              para atribuir a um colaborador.
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}

// ============================================================
// Calendar View
// ============================================================

function CalendarView({
  monthAnchor,
  dayCounts,
  selectedDay,
  onAnchorChange,
  onSelectDay,
}: {
  monthAnchor: Date;
  dayCounts: Record<string, number>;
  selectedDay: string | null;
  onAnchorChange: (d: Date) => void;
  onSelectDay: (dayKey: string) => void;
}) {
  const monthLabel = useMemo(
    () =>
      monthAnchor.toLocaleDateString("pt-PT", {
        month: "long",
        year: "numeric",
      }),
    [monthAnchor],
  );
  const cells = useMemo(() => buildCalendarGrid(monthAnchor), [monthAnchor]);
  const today = new Date();
  return (
    <div className="rounded-2xl border border-border/40 bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-foreground">
          {monthLabel}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const d = new Date(monthAnchor);
              d.setMonth(d.getMonth() - 1);
              onAnchorChange(d);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onAnchorChange(new Date())}
            className="rounded-md bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary/70"
          >
            Hoje
          </button>
          <button
            onClick={() => {
              const d = new Date(monthAnchor);
              d.setMonth(d.getMonth() + 1);
              onAnchorChange(d);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }) => {
          const k = dayKey(date.getTime());
          const count = dayCounts[k] ?? 0;
          const isToday = sameDay(date, today);
          const isSelected = selectedDay === k;
          return (
            <button
              key={k}
              disabled={!inMonth}
              onClick={() => inMonth && onSelectDay(k)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                inMonth
                  ? isSelected
                    ? "bg-[#DC2626] text-white"
                    : "bg-secondary/40 hover:bg-secondary text-foreground"
                  : "text-muted-foreground/40 cursor-default"
              } ${isToday && !isSelected ? "ring-1 ring-[#DC2626]" : ""}`}
              title={
                count > 0
                  ? `${count} pedido(s) em ${date.toLocaleDateString("pt-PT")}`
                  : inMonth
                    ? `Sem pedidos em ${date.toLocaleDateString("pt-PT")}`
                    : undefined
              }
            >
              <span className="font-mono">{date.getDate()}</span>
              {count > 0 && inMonth && (
                <span
                  className={`mt-0.5 inline-flex h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-[#DC2626]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Clica num dia com • para abrir os pedidos desse dia na vista de
        lista.
      </p>
    </div>
  );
}

// ============================================================
// Day Group (list view)
// ============================================================

interface DayGroupProps {
  day: string;
  count: number;
  submissions: Submission[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onSend: (s: Submission) => void;
  onToggleStatus: (id: string, status: SubmissionStatus) => void;
  onToggleArchive: (id: string, status: SubmissionStatus) => void;
  onDelete: (id: string) => void;
  onNotes: (id: string, notes: string) => void;
  onAssign: (id: string, assignedTo: string) => void;
}

function DayGroup({
  day,
  count,
  submissions,
  expandedId,
  onToggleExpand,
  onSend,
  onToggleStatus,
  onToggleArchive,
  onDelete,
  onNotes,
  onAssign,
}: DayGroupProps) {
  const label = useMemo(() => {
    const d = new Date(day + "T12:00:00");
    return formatDateLong(d.getTime());
  }, [day]);
  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 -mx-1 flex items-baseline gap-2 bg-card/95 px-1 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground capitalize">
          {label}
        </h4>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-foreground">
          {count}
        </span>
      </div>
      {submissions.map((s) => (
        <SubmissionRow
          key={s.id}
          s={s}
          isExpanded={expandedId === s.id}
          onToggleExpand={() => onToggleExpand(s.id)}
          onSend={() => onSend(s)}
          onToggleStatus={() =>
            onToggleStatus(s.id, s.status === "new" ? "read" : "new")
          }
          onToggleArchive={() =>
            onToggleArchive(
              s.id,
              s.status === "archived" ? "read" : "archived",
            )
          }
          onDelete={() => onDelete(s.id)}
          onNotes={(notes) => onNotes(s.id, notes)}
          onAssign={(assignedTo) => onAssign(s.id, assignedTo)}
        />
      ))}
    </div>
  );
}

// ============================================================
// Submission Row
// ============================================================

interface SubmissionRowProps {
  s: Submission;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSend: () => void;
  onToggleStatus: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onNotes: (notes: string) => void;
  onAssign: (assignedTo: string) => void;
}

function SubmissionRow({
  s,
  isExpanded,
  onToggleExpand,
  onSend,
  onToggleStatus,
  onToggleArchive,
  onDelete,
  onNotes,
  onAssign,
}: SubmissionRowProps) {
  const [editingAssign, setEditingAssign] = useState(false);

  const commitAssign = (raw: string) => {
    setEditingAssign(false);
    const value = raw.trim();
    if (value === (s.assignedTo ?? "")) return;
    onAssign(value);
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-background transition-colors ${
        isExpanded
          ? "border-[#DC2626]/40 ring-1 ring-[#DC2626]/30"
          : "border-border/40 hover:border-border"
      }`}
    >
      <button
        onClick={onToggleExpand}
        className="flex w-full items-start gap-3 p-3 text-left"
        aria-expanded={isExpanded}
      >
        <StatusBadge status={s.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground">
              {s.name}
            </h4>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE[s.status]}`}
            >
              {STATUS_LABELS[s.status]}
            </span>
          </div>
          <p
            className="mt-0.5 truncate text-[11px] font-mono font-semibold text-foreground"
            title={formatAbsoluteDateTime(s.timestamp)}
          >
            {formatAbsoluteDateTime(s.timestamp)}
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({formatRelativeTime(s.timestamp)})
            </span>
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {s.marca} {s.modelo}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {s.mensagem}
          </p>
          {(s.assignedTo || editingAssign === false) && (
            <div className="mt-2">
              <AssignChip
                value={s.assignedTo}
                isEditing={editingAssign}
                onStartEdit={() => setEditingAssign(true)}
                onCancel={() => setEditingAssign(false)}
                onCommit={commitAssign}
              />
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between gap-1 border-t border-border/30 px-2.5 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onSend}
            className="inline-flex items-center gap-1 rounded-md bg-[#DC2626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#ef4444] transition-colors"
            title="Abrir o cliente de email pré-preenchido"
          >
            <Send className="h-3 w-3" /> Enviar
          </button>
          <a
            href={`tel:${s.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary/70 transition-colors"
            title={`Ligar para ${s.phone}`}
          >
            <Phone className="h-3 w-3" /> Ligar
          </a>
          <a
            href={`mailto:${s.email}`}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary/70 transition-colors"
            title={`Email para ${s.email}`}
          >
            <Mail className="h-3 w-3" /> Responder
          </a>
          {!editingAssign && !s.assignedTo && (
            <button
              onClick={() => setEditingAssign(true)}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#DC2626]/40 bg-[#DC2626]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#DC2626] hover:bg-[#DC2626]/20 transition-colors"
              title="Atribuir este pedido a um colaborador"
            >
              <UserCheck className="h-3 w-3" /> Atender
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleStatus}
            title={s.status === "new" ? "Marcar como lido" : "Marcar como novo"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Alternar estado novo/lido"
          >
            {s.status === "new" ? (
              <MailCheck className="h-3.5 w-3.5 text-[#DC2626]" />
            ) : (
              <MailPlus className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onToggleArchive}
            title={s.status === "archived" ? "Reactivar (voltar a lido)" : "Arquivar"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Arquivar/reactivar"
          >
            {s.status === "archived" ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            title="Apagar pedido"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
            aria-label="Apagar pedido"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="space-y-3 p-3">
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Email" value={s.email} href={`mailto:${s.email}`} icon={Mail} />
                <DetailField
                  label="Telefone"
                  value={s.phone}
                  href={`tel:${s.phone.replace(/\s+/g, "")}`}
                  icon={Phone}
                />
                <DetailField
                  label="Viatura"
                  value={`${s.marca} ${s.modelo}`}
                  icon={MessageSquare}
                />
                <DetailField
                  label="Recebido (exato)"
                  value={formatAbsoluteDateTime(s.timestamp)}
                  icon={CalendarDays}
                />
                {s.assignedTo && (
                  <DetailField
                    label="Atendido por"
                    value={`${s.assignedTo}${s.attendedAt ? ` · ${formatAbsoluteDateTime(s.attendedAt)}` : ""}`}
                    icon={UserCheck}
                  />
                )}
                <DetailField
                  label="Estado"
                  value={STATUS_LABELS[s.status]}
                  icon={MailCheck}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Mensagem do cliente
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                  {s.mensagem}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground inline-flex items-center gap-1.5">
                  <StickyNote className="h-3 w-3" /> Notas internas
                </p>
                <textarea
                  defaultValue={s.notes ?? ""}
                  rows={2}
                  placeholder="Ex: Liguei em 12 Fev, marcar revisão para terça."
                  onBlur={(e) => {
                    const v = e.currentTarget.value;
                    if (v !== (s.notes ?? "")) onNotes(v);
                  }}
                  className="mt-1 w-full rounded-md border border-border/40 bg-secondary/30 px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/40 resize-y"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Assign Chip
// ============================================================

function AssignChip({
  value,
  isEditing,
  onStartEdit,
  onCancel,
  onCommit,
}: {
  value?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onCommit: (v: string) => void;
}) {
  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <UserCheck className="h-3 w-3 text-[#DC2626]" />
        <input
          autoFocus
          defaultValue={value ?? ""}
          placeholder="Nome do funcionário"
          onBlur={(e) => onCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.currentTarget as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          className="h-7 w-44 rounded-md border border-[#DC2626]/50 bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/40"
        />
      </div>
    );
  }
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={onStartEdit}
      title="Clica para reatribuir"
      className="inline-flex items-center gap-1 rounded-full border border-[#DC2626]/30 bg-[#DC2626]/10 px-2 py-0.5 text-[10px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/20 transition-colors"
    >
      <UserCheck className="h-3 w-3" />
      {value}
      <Edit3 className="h-2.5 w-2.5 opacity-60" />
    </button>
  );
}

// ============================================================
// Misc small components
// ============================================================

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, { icon: React.ReactNode; ring: string }> = {
    new: {
      icon: <MailPlus className="h-4 w-4" />,
      ring: "bg-[#DC2626]/15 text-[#DC2626] ring-1 ring-[#DC2626]/30",
    },
    read: {
      icon: <MailCheck className="h-4 w-4" />,
      ring: "bg-secondary text-muted-foreground",
    },
    archived: {
      icon: <Archive className="h-4 w-4" />,
      ring: "bg-secondary/60 text-muted-foreground/70",
    },
  };
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${map[status].ring}`}
    >
      {map[status].icon}
    </div>
  );
}

function DetailField({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const inner = (
    <>
      <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-2.5 w-2.5" /> {label}
      </p>
      <p className="mt-0.5 break-words text-xs text-foreground">{value}</p>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="block rounded-md bg-secondary/30 px-2 py-1.5 transition-colors hover:bg-secondary/60"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded-md bg-secondary/30 px-2 py-1.5">{inner}</div>;
}
