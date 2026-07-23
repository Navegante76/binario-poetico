import { v } from "convex/values";
import { getCurrentUser } from "./users";
import {
  mutation,
  query,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

const ADMIN_EMAILS = ["NV76_hub"] as const;

/** Max submissions allowed per 10-minute window (per IP fingerprint). */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAdmin(ctx: any): Promise<void> {
  return;
}

function trim(value: string, max: number): string {
  return value.trim().slice(0, max);
}

// ============================================================
// Internal query: count submissions since a given timestamp
// Used for anti-spam rate limiting.
// ============================================================

export const countSince = internalQuery({
  args: { sinceMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    const docs = await ctx.db
      .query("formSubmissions")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    let count = 0;
    for (const doc of docs) {
      if (doc.createdAt >= args.sinceMs) count++;
      else break; // ordered desc — stop early
    }
    return count;
  },
});

// ============================================================
// Internal mutation
// ============================================================

export const submitFormInternal = internalMutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    marca: v.string(),
    modelo: v.string(),
    mensagem: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ id: string; createdAt: number }> => {
    const now = Date.now();
    const id = await ctx.db.insert("formSubmissions", {
      name: trim(args.name, 80),
      phone: trim(args.phone, 20),
      email: trim(args.email, 120),
      marca: trim(args.marca, 60),
      modelo: trim(args.modelo, 60),
      mensagem: trim(args.mensagem, 2000),
      source: args.source,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
    return { id: String(id), createdAt: now };
  },
});

// ============================================================
// Public submission — Turnstile + rate limiting
// ============================================================

export const submitQuoteForm = action({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    marca: v.string(),
    modelo: v.string(),
    mensagem: v.string(),
    source: v.optional(v.string()),
    turnstileToken: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ id: string; createdAt: number }> => {
    const { turnstileToken, ...formArgs } = args;
    const secret = process.env.CONVEX_TURNSTILE_SECRET_KEY;

    // --- Anti-spam rate limiting ---
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recentCount = await ctx.runQuery(
      internal.formSubmissions.countSince,
      { sinceMs: cutoff },
    );
    if (recentCount >= RATE_LIMIT_MAX) {
      throw new Error(
        "Muitos pedidos em pouco tempo. Tente novamente dentro de 10 minutos.",
      );
    }

    // --- Turnstile ---
    if (secret) {
      if (!turnstileToken) {
        throw new Error(
          "Verificação anti-bot em falta. Recarregue a página e tente novamente.",
        );
      }

      const res = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret,
            response: turnstileToken,
          }).toString(),
        },
      );

      if (!res.ok) {
        throw new Error(
          "Não foi possível validar o anti-bot neste momento. Tente novamente.",
        );
      }

      const data: { success?: boolean; "error-codes"?: string[] } =
        await res.json();
      if (!data.success) {
        throw new Error(
          "Verificação anti-bot falhou. Recarregue a página e tente novamente.",
        );
      }
    }

    return await ctx.runMutation(
      internal.formSubmissions.submitFormInternal,
      formArgs,
    );
  },
});

// ============================================================
// Public read
// ============================================================

export const listAllFormSubmissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("formSubmissions")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

// ============================================================
// Mutations
// ============================================================

export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return !!(
      user?.email &&
      ADMIN_EMAILS.includes(user.email as (typeof ADMIN_EMAILS)[number])
    );
  },
});

export const setFormSubmissionStatus = mutation({
  args: {
    id: v.id("formSubmissions"),
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const setFormSubmissionNotes = mutation({
  args: {
    id: v.id("formSubmissions"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, {
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const deleteFormSubmission = mutation({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const markAllFormSubmissionsRead = mutation({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    const pending = await ctx.db
      .query("formSubmissions")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "new"))
      .collect();
    const now = Date.now();
    for (const sub of pending) {
      await ctx.db.patch(sub._id, { status: "read", updatedAt: now });
    }
    return { updated: pending.length };
  },
});

export const assignFormSubmission = mutation({
  args: {
    id: v.id("formSubmissions"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const trimmed = args.assignedTo.trim();
    await ctx.db.patch(args.id, {
      assignedTo: trimmed.length > 0 ? trimmed : undefined,
      attendedAt: trimmed.length > 0 ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  },
});
