import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CONTENT,
  type SiteContent,
  type SocialLink,
} from "@/data/site-content";

// ============================================================
// Types
// ============================================================

export type DevRole = "developer" | "manager" | "boss" | "employee";

export interface DevAccount {
  id: string;
  name: string;
  password: string;
  role: DevRole;
  loginHistory: number[];
  createdAt: number;
}

interface DevAuthState {
  isDevAuthenticated: boolean;
  devName: string;
  devRole: DevRole | null;
  devAccountId: string | null;
}

interface ContentContextValue {
  content: SiteContent;
  isDevMode: boolean;
  canEditContent: boolean;
  updateContent: (path: string, value: unknown) => void;
  resetContent: () => void;
}

// ============================================================
// Permission helpers
// ============================================================

export const ROLE_RANK: Record<DevRole, number> = {
  developer: 1,
  manager: 2,
  boss: 3,
  employee: 4,
};

export const PRIVILEGED_ROLES: ReadonlyArray<DevRole> = [
  "developer",
  "manager",
  "boss",
];

export function canManageRoster(role: DevRole | null | undefined): boolean {
  return !!role && PRIVILEGED_ROLES.includes(role);
}

export function canSeeLastSeen(role: DevRole | null | undefined): boolean {
  return !!role && PRIVILEGED_ROLES.includes(role);
}

export function canSeeLoginHistory(
  actorRole: DevRole | null | undefined,
  actorId: string | null | undefined,
  targetRole: DevRole,
  targetId: string,
): boolean {
  if (!actorRole) return false;
  if (actorRole === "employee") return false;
  if (actorId === targetId) return true;
  if (actorRole === "manager") {
    return targetRole === "employee" || targetRole === "manager";
  }
  return true;
}

export function canSeeLastSeenOf(
  actorRole: DevRole | null | undefined,
  targetRole: DevRole,
): boolean {
  if (!actorRole) return false;
  if (actorRole === "employee") return false;
  if (actorRole === "manager") {
    return targetRole === "employee" || targetRole === "manager";
  }
  return true;
}

export function canEditContent(role: DevRole | null | undefined): boolean {
  return !!role && role !== "employee";
}

export function canRemoveAccount(
  actorRole: DevRole | null | undefined,
  targetRole: DevRole,
): boolean {
  if (!actorRole) return false;
  return ROLE_RANK[actorRole] <= ROLE_RANK[targetRole];
}

export function roleLabel(role: DevRole): string {
  switch (role) {
    case "developer":
      return "Desenvolvedor";
    case "manager":
      return "Gerente";
    case "boss":
      return "Chefe";
    case "employee":
      return "Funcionário";
  }
}

// ============================================================
// Storage keys — versioned, brand-rename safe
// ============================================================

const ROSTER_KEY = "oficina_dev_accounts_v2";
const DEV_AUTH_KEY = "oficina_dev_auth";

const LEGACY_ROSTER_KEYS = [
  "binario_dev_accounts_v2",
  "binario_dev_accounts_v1",
];
const LEGACY_AUTH_KEYS = ["binario_dev_auth"];

/** Content keys tagged as "legacy" → automatically wiped on next load.
 *  Each version bump adds the prior version to this list so the browser
 *  never serves stale data after DEFAULT_CONTENT changes. */
const LEGACY_CONTENT_KEYS = [
  "binario_site_content",
  "oficina_site_content_v1",
  "oficina_site_content_v2",
  "oficina_site_content_v3",
];

function contentKey(version: number): string {
  return `oficina_site_content_v${version}`;
}

const CONTENT_VERSION = 4;

function uid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_ACCOUNTS = 50;
const MAX_LOGIN_HISTORY = 50;

// ============================================================
// Roster
// ============================================================

interface LegacyEntry extends Partial<DevAccount> {
  lastSeenAt?: number;
}

function readWithMigration(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = localStorage.getItem(ROSTER_KEY);
    if (current) return current;
  } catch { /* ignore */ }
  for (const legacy of LEGACY_ROSTER_KEYS) {
    let raw: string | null = null;
    try { raw = localStorage.getItem(legacy); } catch { continue; }
    if (!raw) continue;
    try {
      localStorage.setItem(ROSTER_KEY, raw);
      try { localStorage.removeItem(legacy); } catch { /* ignore */ }
      return raw;
    } catch { return raw; }
  }
  return null;
}

function loadRoster(): DevAccount[] {
  const raw = readWithMigration();
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const migrated: DevAccount[] = parsed
          .map((entry): DevAccount | null => {
            if (!entry || typeof entry !== "object") return null;
            const e = entry as LegacyEntry;
            if (
              typeof e.id !== "string" ||
              typeof e.name !== "string" ||
              typeof e.password !== "string"
            ) return null;
            const r = e.role;
            const role: DevRole =
              r === "developer" || r === "manager" || r === "boss" || r === "employee"
                ? r : "manager";
            const createdAt = typeof e.createdAt === "number" ? e.createdAt : Date.now();
            let loginHistory: number[];
            if (Array.isArray(e.loginHistory)) {
              loginHistory = e.loginHistory
                .filter((t): t is number => typeof t === "number")
                .slice(-MAX_LOGIN_HISTORY);
            } else if (typeof e.lastSeenAt === "number") {
              loginHistory = [e.lastSeenAt];
            } else {
              loginHistory = [];
            }
            return { id: e.id, name: e.name, password: e.password, role, createdAt, loginHistory };
          })
          .filter((a): a is DevAccount => a !== null);
        if (migrated.length > 0) { saveRoster(migrated); return migrated; }
      }
    }
  } catch { /* corrupt */ }
  const seed: DevAccount[] = [
    { id: uid(), name: "Pedro Pais", password: "NV76_hub", role: "manager", createdAt: Date.now(), loginHistory: [] },
    { id: uid(), name: "Gerente", password: "1234", role: "manager", createdAt: Date.now(), loginHistory: [] },
    { id: uid(), name: "Func", password: "1234", role: "employee", createdAt: Date.now(), loginHistory: [] },
  ];
  saveRoster(seed);
  return seed;
}

function saveRoster(roster: DevAccount[]) {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); } catch { /* ignore */ }
}

// ============================================================
// Dev session
// ============================================================

function readAuthWithMigration(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = localStorage.getItem(DEV_AUTH_KEY);
    if (current) return current;
  } catch { /* ignore */ }
  for (const legacy of LEGACY_AUTH_KEYS) {
    let raw: string | null = null;
    try { raw = localStorage.getItem(legacy); } catch { continue; }
    if (!raw) continue;
    try {
      localStorage.setItem(DEV_AUTH_KEY, raw);
      try { localStorage.removeItem(legacy); } catch { /* ignore */ }
      return raw;
    } catch { return raw; }
  }
  return null;
}

function loadDevAuth(): DevAuthState {
  try {
    const raw = readAuthWithMigration();
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DevAuthState>;
      if (typeof parsed.isDevAuthenticated === "boolean" && typeof parsed.devName === "string") {
        return {
          isDevAuthenticated: parsed.isDevAuthenticated,
          devName: parsed.devName,
          devRole: parsed.devRole ?? null,
          devAccountId: parsed.devAccountId ?? null,
        };
      }
    }
  } catch { /* ignore */ }
  return { isDevAuthenticated: false, devName: "", devRole: null, devAccountId: null };
}

function saveDevAuth(state: DevAuthState) {
  try { localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ============================================================
// Content helpers
// ============================================================

/**
 * Detect an object that "looks like a corrupted array" — a plain Object with
 * only numeric-string keys (0,1,2,…) — the canonical artefact of the old
 * bugs that did `current[key] = { ...someArray }` inside an object literal.
 *
 * Returns the indices in numeric order so callers can rebuild a real Array.
 */
function looksLikeCorruptedArray(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  const keys = Object.keys(node);
  if (keys.length === 0) return false;
  for (const k of keys) {
    if (!/^\d+$/.test(k)) return false;
  }
  return true;
}

/**
 * Convert a plain-object-that-was-an-array into a real Array, preserving
 * numeric ordering and excluding the `length` pseudo-key. Missing indices
 * become `undefined` so the array length matches the source.
 */
function restoredArrayFromObject(obj: Record<string, unknown>): unknown[] {
  const numericKeys = Object.keys(obj)
    .filter((k) => /^\d+$/.test(k))
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  if (numericKeys.length === 0) return [];
  const max = numericKeys[numericKeys.length - 1];
  const out: unknown[] = new Array(max + 1);
  for (const i of numericKeys) {
    out[i] = obj[String(i)];
  }
  return out;
}

/**
 * Recursive, type-aware merge of `source` onto `target`.
 *
 * Key behaviours:
 *
 *   1) ARRAYS — target is an Array (defines structure). If source provides
 *      a real Array we use it directly.  If source is a corrupted plain
 *      Object (numeric-string keys — the legacy `setNested` bug artefact)
 *      we reconstruct a real Array using `Object.assign([...targetVal],
 *      srcVal)` so user edits are preserved and the prototype/length are
 *      restored.
 *
 *   2) PLAIN OBJECTS — we recurse so we can reach nested Arrays (e.g.
 *      `assets.gallery`, `links.socials`, `navbar.items`).  The previous
 *      shallow-only merge never reached those leaves, so any corruption at
 *      `assets.gallery` survived into the loaded state and `asArray([])`
 *      downstream produced the empty placeholder you saw.
 *
 *   3) PRIMITIVES — source wins.
 */
function deepMerge(target: unknown, source: unknown): unknown {
  if (!source || typeof source !== "object") return source;
  if (!target || typeof target !== "object") {
    // Source is an object but target is missing/primitive — heal from source.
    return Array.isArray(source) ? source.slice() : { ...source };
  }

  // Array branch (target is the array, src may be array or corrupted object).
  if (Array.isArray(target)) {
    if (Array.isArray(source)) return source;
    if (looksLikeCorruptedArray(source)) {
      // Rebuild a proper Array, preserving user-edited indices.
      // We graft savedObj keys onto a FRESH CLONE of targetVal so any custom
      // overrides the user made (e.g. swapped images) survive.
      const grafted = [...target];
      for (const k of Object.keys(source)) {
        if (/^\d+$/.test(k)) {
          grafted[parseInt(k, 10)] = (source as Record<string, unknown>)[k];
        }
      }
      return grafted;
    }
    // src is the wrong shape for an array — keep target.
    return target;
  }

  if (Array.isArray(source)) {
    // Target is a plain object but source is an array — keep target.
    return { ...(target as Record<string, unknown>) };
  }

  // Both plain objects: deep-merge keys recursively.
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const srcVal = (source as Record<string, unknown>)[key];
    const targetVal = (target as Record<string, unknown>)[key];
    if (srcVal && typeof srcVal === "object") {
      result[key] = deepMerge(targetVal, srcVal);
    } else if (srcVal === undefined) {
      // Skip undefined keys (preserve target).
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

/**
 * Walk a dot-path inside `obj` and replace the leaf value with `value`.
 * Returns a shallow-cloned tree so React state updates correctly.
 *
 * Three guarantees at every traversal step:
 *
 *   1) Arrays are cloned with `[...node]` (NOT `{ ...node }` — that strips
 *      the Array prototype + length own-property, turning it into a plain
 *      Object, which downstream `Array.isArray(...)` checks detect).
 *
 *   2) If `current[key]` happens to be a plain Object with only numeric
 *      keys (a previously-corrupted array from before the fix), we
 *      reconstruct a real Array before cloning so the rest of the
 *      traversal and downstream consumers see a proper Array.
 *
 *   3) Plain objects are cloned with `{ ...node }`.
 */
function setNested(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split(".");
  const result = { ...obj };
  // `current` may be either a plain object or an array — both satisfy
  // bracket assignment, so we type it loosely on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const node = current[key];
    if (node === undefined || node === null || typeof node !== "object") {
      // Missing/undefined segment → start a fresh object.
      current[key] = {};
    } else if (Array.isArray(node)) {
      current[key] = [...node];
    } else if (looksLikeCorruptedArray(node)) {
      // In-memory state defencse: heal a previously-corrupted array shape
      // before cloning. Otherwise `{ ...corruptedObj }` keeps it as a
      // plain Object and downstream `Array.isArray` checks fail.
      current[key] = restoredArrayFromObject(node);
    } else {
      current[key] = { ...node };
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

function migrateSocialsInLinks(saved: Record<string, unknown>): Record<string, unknown> {
  const rootLinks = saved.links as Record<string, unknown> | undefined;
  if (!rootLinks) return saved;
  const hasOldSocialStrings = ["facebook", "instagram", "linkedin", "tiktok"].some(
    (k) => typeof rootLinks[k] === "string",
  );
  const socials = rootLinks.socials;
  const hasNewSocialsList = Array.isArray(socials) && socials.length > 0;
  if (hasOldSocialStrings && !hasNewSocialsList) {
    const migrated: SocialLink[] = [
      { id: "facebook", name: "Facebook", url: String(rootLinks.facebook ?? ""), icon: "facebook", active: !!rootLinks.facebook },
      { id: "instagram", name: "Instagram", url: String(rootLinks.instagram ?? ""), icon: "instagram", active: !!rootLinks.instagram },
      { id: "linkedin", name: "LinkedIn", url: String(rootLinks.linkedin ?? ""), icon: "linkedin", active: !!rootLinks.linkedin },
      { id: "tiktok", name: "TikTok", url: String(rootLinks.tiktok ?? ""), icon: "tiktok", active: !!rootLinks.tiktok },
    ];
    delete rootLinks.facebook;
    delete rootLinks.instagram;
    delete rootLinks.linkedin;
    delete rootLinks.tiktok;
    rootLinks.socials = migrated;
  }
  return saved;
}

function loadContent(): SiteContent {
  try {
    if (typeof window === "undefined") return { ...DEFAULT_CONTENT };
    const currentKey = contentKey(CONTENT_VERSION);

    let hadLegacy = false;
    for (const legacy of LEGACY_CONTENT_KEYS) {
      try { if (localStorage.getItem(legacy) !== null) hadLegacy = true; } catch { /* ignore */ }
    }

    if (hadLegacy) {
      for (const legacy of LEGACY_CONTENT_KEYS) {
        try { localStorage.removeItem(legacy); } catch { /* ignore */ }
      }
      try { localStorage.removeItem(currentKey); } catch { /* ignore */ }
      try { localStorage.setItem(currentKey, JSON.stringify(DEFAULT_CONTENT)); } catch { /* quota */ }
      return { ...DEFAULT_CONTENT };
    }

    try {
      const raw = localStorage.getItem(currentKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        const migrated = migrateSocialsInLinks(saved);
        // The recursive deepMerge now goes ALL the way down: when it
        // reaches `assets.gallery` (or any other leaf array) it will
        // reconstruct it as a real Array even if the on-disk value was
        // left as a corrupted plain Object by an earlier bug.
        const merged = deepMerge(DEFAULT_CONTENT, migrated) as SiteContent;
        // Persist the healed form back so subsequent loads + setNested
        // calls see a healthy Array from the start.
        try { localStorage.setItem(currentKey, JSON.stringify(merged)); } catch { /* quota */ }
        return merged;
      }
    } catch { /* fall through */ }

    try { localStorage.setItem(currentKey, JSON.stringify(DEFAULT_CONTENT)); } catch { /* quota */ }
    return { ...DEFAULT_CONTENT };
  } catch {
    return { ...DEFAULT_CONTENT };
  }
}

// ============================================================
// Dev Auth Context
// ============================================================

interface AddAccountInput {
  name: string;
  password: string;
  role?: DevRole;
}

interface DevAuthContextValue extends DevAuthState {
  login: (name: string, password: string) => boolean;
  logout: () => void;
  accounts: DevAccount[];
  addAccount: (input: AddAccountInput) => { ok: boolean; reason?: string };
  removeAccount: (id: string) => { ok: boolean; reason?: string };
  canManageRoster: boolean;
  canSeeLastSeen: boolean;
}

const DevAuthContext = createContext<DevAuthContextValue>({
  isDevAuthenticated: false,
  devName: "",
  devRole: null,
  devAccountId: null,
  login: () => false,
  logout: () => {},
  accounts: [],
  addAccount: () => ({ ok: false, reason: "Provider indisponível." }),
  removeAccount: () => ({ ok: false, reason: "Provider indisponível." }),
  canManageRoster: false,
  canSeeLastSeen: false,
});

export function useDevAuth() {
  return useContext(DevAuthContext);
}

const ContentContext = createContext<ContentContextValue>({
  content: DEFAULT_CONTENT,
  isDevMode: false,
  canEditContent: false,
  updateContent: () => {},
  resetContent: () => {},
});

export function useContent() {
  return useContext(ContentContext);
}

// ============================================================
// Combined Provider
// ============================================================

export function DevProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<DevAuthState>(loadDevAuth);
  const [content, setContent] = useState<SiteContent>(loadContent);
  const [accounts, setAccounts] = useState<DevAccount[]>(() => loadRoster());

  useEffect(() => {
    setAuth(loadDevAuth());
    setContent(loadContent());
    setAccounts(loadRoster());
  }, []);

  const login = useCallback(
    (name: string, password: string) => {
      const match = accounts.find(
        (a) => a.name.trim() === name.trim() && a.password === password,
      );
      if (!match) return false;
      const stamp = Date.now();
      const updatedAccounts = accounts.map((a) =>
        a.id === match.id
          ? { ...a, loginHistory: [...a.loginHistory, stamp].slice(-MAX_LOGIN_HISTORY) }
          : a,
      );
      setAccounts(updatedAccounts);
      saveRoster(updatedAccounts);
      const state: DevAuthState = {
        isDevAuthenticated: true,
        devName: match.name,
        devRole: match.role,
        devAccountId: match.id,
      };
      saveDevAuth(state);
      setAuth(state);
      return true;
    },
    [accounts],
  );

  const logout = useCallback(() => {
    const state: DevAuthState = {
      isDevAuthenticated: false,
      devName: "",
      devRole: null,
      devAccountId: null,
    };
    saveDevAuth(state);
    setAuth(state);
  }, []);

  const addAccount = useCallback(
    (input: AddAccountInput): { ok: boolean; reason?: string } => {
      if (!canManageRoster(auth.devRole)) {
        return { ok: false, reason: "Apenas Gerentes, Chefes e Desenvolvedores podem adicionar contas." };
      }
      const cleanName = input.name.trim();
      const cleanPwd = input.password;
      const role: DevRole = input.role ?? "employee";
      if (cleanName.length < 2) return { ok: false, reason: "Nome demasiado curto (mínimo 2 caracteres)." };
      if (cleanPwd.length < 4) return { ok: false, reason: "Palavra-passe demasiado curta (mínimo 4 caracteres)." };
      if (accounts.some((a) => a.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        return { ok: false, reason: "Já existe uma conta com esse nome." };
      }
      if (accounts.length >= MAX_ACCOUNTS) {
        return { ok: false, reason: `Limite máximo de ${MAX_ACCOUNTS} contas atingido.` };
      }
      const next: DevAccount = {
        id: uid(), name: cleanName, password: cleanPwd, role,
        createdAt: Date.now(), loginHistory: [],
      };
      const updated = [...accounts, next];
      setAccounts(updated);
      saveRoster(updated);
      return { ok: true };
    },
    [accounts, auth.devRole],
  );

  const removeAccount = useCallback(
    (id: string): { ok: boolean; reason?: string } => {
      if (!canManageRoster(auth.devRole)) {
        return { ok: false, reason: "Apenas Gerentes, Chefes e Desenvolvedores podem remover contas." };
      }
      if (accounts.length <= 1) return { ok: false, reason: "Tem de existir pelo menos uma conta." };
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return { ok: false, reason: "Conta não encontrada." };
      if (auth.isDevAuthenticated && auth.devAccountId === acc.id) {
        return { ok: false, reason: "Não pode remover a conta com a sessão ativa." };
      }
      if (!canRemoveAccount(auth.devRole, acc.role)) {
        return { ok: false, reason: `Não tem permissão para remover um ${roleLabel(acc.role)}.` };
      }
      const isPrivileged = PRIVILEGED_ROLES.includes(acc.role);
      if (isPrivileged) {
        const remainingPrivileged = accounts.filter(
          (a) => a.id !== id && PRIVILEGED_ROLES.includes(a.role),
        );
        if (remainingPrivileged.length === 0) {
          return { ok: false, reason: "Tem de existir pelo menos um utilizador com privilégios." };
        }
      }
      const updated = accounts.filter((a) => a.id !== id);
      setAccounts(updated);
      saveRoster(updated);
      return { ok: true };
    },
    [accounts, auth.devAccountId, auth.devRole, auth.isDevAuthenticated],
  );

  const updateContent = useCallback((path: string, value: unknown) => {
    setContent((prev) => {
      // Heal the in-memory state first: if the previous tree already had a
      // corrupted array shape (e.g. user kept the tab open across deploys),
      // setNested's own internal checks will rebuild it, but a top-level
      // defense makes the next load robust too.
      const cleaned = deepMerge(DEFAULT_CONTENT, prev) as SiteContent;
      const updated = setNested(
        cleaned as unknown as Record<string, unknown>,
        path,
        value,
      ) as unknown as SiteContent;
      try {
        localStorage.setItem(contentKey(CONTENT_VERSION), JSON.stringify(updated));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          window.alert(
            "Limite de armazenamento atingido no browser (~5 MB).\n" +
              "Imagens carregadas do computador são grandes (data URLs). Tente:\n" +
              " • Voltar algumas imagens para URL remotos,\n" +
              " • ou reduzir o número de fotos locais.",
          );
        }
      }
      try {
        fetch("/api/dev-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }).catch(() => {});
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const resetContent = useCallback(() => {
    setContent({ ...DEFAULT_CONTENT });
    try { localStorage.removeItem(contentKey(CONTENT_VERSION)); } catch { /* ignore */ }
    try { localStorage.setItem(contentKey(CONTENT_VERSION), JSON.stringify(DEFAULT_CONTENT)); } catch { /* ignore */ }
  }, []);

  const isDevMode = auth.isDevAuthenticated;
  const canEdit = canEditContent(auth.devRole);

  const value = useMemo<DevAuthContextValue>(
    () => ({
      ...auth, login, logout, accounts, addAccount, removeAccount,
      canManageRoster: canManageRoster(auth.devRole),
      canSeeLastSeen: canSeeLastSeen(auth.devRole),
    }),
    [auth, login, logout, accounts, addAccount, removeAccount],
  );

  return (
    <DevAuthContext.Provider value={value}>
      <ContentContext.Provider
        value={{ content, isDevMode, canEditContent: canEdit, updateContent, resetContent }}
      >
        {children}
      </ContentContext.Provider>
    </DevAuthContext.Provider>
  );
}
