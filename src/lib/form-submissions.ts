import { useAction, useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================================
// Types
// ============================================================

export type SubmissionStatus = "new" | "read" | "archived";

export interface Submission {
  /** Convex document id (typed as string for caller convenience) */
  id: string;
  /** Unix ms when the form was submitted */
  timestamp: number;
  name: string;
  phone: string;
  email: string;
  marca: string;
  modelo: string;
  mensagem: string;
  status: SubmissionStatus;
  /** Internal notes only visible to the dev panel */
  notes?: string;
  /** Page URL where submitted (helps with UTM/campaign tracking) */
  source?: string;
  /** Employee / collaborator who took care of the request */
  assignedTo?: string;
  /** Unix ms when assigned */
  attendedAt?: number;
}

// ============================================================
// Environment helpers
// ============================================================

/** Returns true when the public Cloudflare Turnstile site key is configured. */
export function isTurnstileEnabled(): boolean {
  return !!import.meta.env.VITE_TURNSTILE_SITE_KEY;
}

// ============================================================
// Pure formatting helpers (Portuguese locale)
// ============================================================

const DATETIME_FULL = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_MED = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const HHMM = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_LONG = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function formatAbsoluteDateTime(ts: number): string {
  return DATETIME_FULL.format(new Date(ts));
}

export function formatDateLong(ts: number): string {
  return DATE_LONG.format(new Date(ts));
}

export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  const d = new Date(ts);
  if (days === 1) return `Ontem às ${HHMM.format(d)}`;
  if (days < 7) return `${WEEKDAYS[d.getDay()]} ${HHMM.format(d)}`;
  return DATE_MED.format(d);
}

/**
 * Returns the date key (YYYY-MM-DD, local TZ) for a given timestamp.
 * Used as the bucket key for grouping submissions by day.
 */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ============================================================
// Email helper (mailto: URL builder) — kept because the inbox
// panel's "📤 Enviar" reply action still uses it.
// ============================================================

export function buildSubmissionMailto(s: Submission, recipient: string): string {
  const subject = encodeURIComponent(
    `[Site] Pedido de orçamento — ${s.name} (${s.marca} ${s.modelo})`,
  );
  const bodyLines = [
    `Pedido de orçamento recebido pelo site`,
    ``,
    `Nome:     ${s.name}`,
    `Telefone: ${s.phone}`,
    `Email:    ${s.email}`,
    `Viatura:  ${s.marca} ${s.modelo}`,
    ``,
    `Mensagem:`,
    s.mensagem,
    ``,
    `---`,
    `Enviado em: ${formatAbsoluteDateTime(s.timestamp)}`,
  ];
  if (s.notes) {
    bodyLines.push(``, `Notas internas:`, s.notes);
  }
  if (s.assignedTo) {
    bodyLines.push(``, `Atendido por:`, s.assignedTo);
  }
  return `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
}

// ============================================================
// React hooks — Convex-backed
// ============================================================

export function useSubmitForm() {
  return useAction(api.formSubmissions.submitQuoteForm);
}

export interface UseSubmissionsResult {
  /** True if the read query resolved (public read) */
  isAdmin: boolean;
  /** Loading flag (true while we are hydrating from Convex) */
  isLoading: boolean;
  /** Submissions, newest first (empty until loaded) */
  submissions: Submission[];
  newCount: number;
  total: number;
  save: (
    input: Omit<Submission, "id" | "timestamp" | "status"> & {
      status?: SubmissionStatus;
    },
  ) => Promise<{ id: string; createdAt: number }>;
  remove: (id: string) => Promise<void>;
  updateStatus: (id: string, status: SubmissionStatus) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  assign: (id: string, assignedTo: string) => Promise<void>;
  markAllRead: () => Promise<{ updated: number }>;
  clearAll: () => Promise<void>;
}

interface ConvexSubmissionDoc {
  _id: Id<"formSubmissions">;
  _creationTime: number;
  name: string;
  phone: string;
  email: string;
  marca: string;
  modelo: string;
  mensagem: string;
  status: SubmissionStatus;
  notes?: string;
  source?: string;
  assignedTo?: string;
  attendedAt?: number;
  createdAt: number;
  updatedAt: number;
}

function docToSubmission(doc: ConvexSubmissionDoc): Submission {
  return {
    id: doc._id,
    timestamp: doc.createdAt,
    name: doc.name,
    phone: doc.phone,
    email: doc.email,
    marca: doc.marca,
    modelo: doc.modelo,
    mensagem: doc.mensagem,
    status: doc.status,
    notes: doc.notes,
    source: doc.source,
    assignedTo: doc.assignedTo,
    attendedAt: doc.attendedAt,
  };
}

/**
 * Read is public per product decision. Mutations are also public in
 * dev (`checkAdmin` bypassed) — re-enable for production by restoring
 * the `await checkAdmin(ctx)` calls in each mutation in formSubmissions.ts.
 */
export function useSubmissions(): UseSubmissionsResult {
  const rawSubs = useQuery(api.formSubmissions.listAllFormSubmissions, {});

  const submitAction = useAction(api.formSubmissions.submitQuoteForm);
  const removeMutation = useMutation(api.formSubmissions.deleteFormSubmission);
  const updateStatusMutation = useMutation(
    api.formSubmissions.setFormSubmissionStatus,
  );
  const updateNotesMutation = useMutation(
    api.formSubmissions.setFormSubmissionNotes,
  );
  const assignMutation = useMutation(api.formSubmissions.assignFormSubmission);
  const markAllReadMutation = useMutation(
    api.formSubmissions.markAllFormSubmissionsRead,
  );

  const submissions: Submission[] = useMemo(() => {
    if (!rawSubs) return [];
    return rawSubs
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(docToSubmission);
  }, [rawSubs]);

  const isLoading = rawSubs === undefined;
  const isAdmin = !!rawSubs;

  return {
    isAdmin,
    isLoading,
    submissions,
    newCount: submissions.filter((s) => s.status === "new").length,
    total: submissions.length,

    save: async (input) => {
      return await submitAction({
        name: input.name,
        phone: input.phone,
        email: input.email,
        marca: input.marca,
        modelo: input.modelo,
        mensagem: input.mensagem,
        source: input.source,
        turnstileToken: "",
      });
    },

    remove: (id) =>
      removeMutation({ id: id as Id<"formSubmissions"> }).then(
        () => undefined,
      ),

    updateStatus: (id, status) =>
      updateStatusMutation({
        id: id as Id<"formSubmissions">,
        status,
      }).then(() => undefined),

    updateNotes: (id, notes) =>
      updateNotesMutation({
        id: id as Id<"formSubmissions">,
        notes,
      }).then(() => undefined),

    assign: (id, assignedTo) =>
      assignMutation({
        id: id as Id<"formSubmissions">,
        assignedTo,
      }).then(() => undefined),

    markAllRead: () => markAllReadMutation(),

    clearAll: async () => {
      for (const s of submissions) {
        await removeMutation({ id: s.id as Id<"formSubmissions"> });
      }
    },
  };
}
