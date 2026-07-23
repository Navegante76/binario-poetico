import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  EyeOff,
  HardHat,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  canManageRoster,
  canRemoveAccount,
  canSeeLastSeen,
  canSeeLastSeenOf,
  canSeeLoginHistory,
  roleLabel,
  useDevAuth,
  type DevAccount,
  type DevRole,
} from "@/lib/dev-auth";
import { toast } from "sonner";

interface DevAccountsPanelProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_VISUALS: Record<
  DevRole,
  {
    Icon: typeof Wrench;
    label: string;
    badgeClass: string;
    avatarClass: string;
    iconClass: string;
  }
> = {
  developer: {
    Icon: Wrench,
    label: roleLabel("developer"),
    badgeClass:
      "bg-blue-100/40 text-blue-700 ring-1 ring-blue-700/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
    avatarClass:
      "bg-blue-100/40 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    iconClass: "text-blue-700 dark:text-blue-300",
  },
  manager: {
    Icon: Briefcase,
    label: roleLabel("manager"),
    badgeClass:
      "bg-emerald-100/40 text-emerald-700 ring-1 ring-emerald-700/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    avatarClass:
      "bg-emerald-100/40 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    iconClass: "text-emerald-700 dark:text-emerald-300",
  },
  boss: {
    Icon: Crown,
    label: roleLabel("boss"),
    badgeClass:
      "bg-purple-100/40 text-purple-700 ring-1 ring-purple-700/20 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-400/30",
    avatarClass:
      "bg-purple-100/40 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    iconClass: "text-purple-700 dark:text-purple-300",
  },
  employee: {
    Icon: HardHat,
    label: roleLabel("employee"),
    badgeClass: "bg-secondary text-muted-foreground ring-1 ring-border/40",
    avatarClass: "bg-secondary text-muted-foreground",
    iconClass: "text-muted-foreground",
  },
};

const ROLE_OPTIONS: Array<{ key: DevRole; Icon: typeof Wrench; label: string }> = [
  { key: "developer", Icon: Wrench, label: roleLabel("developer") },
  { key: "manager", Icon: Briefcase, label: roleLabel("manager") },
  { key: "boss", Icon: Crown, label: roleLabel("boss") },
  { key: "employee", Icon: HardHat, label: roleLabel("employee") },
];

function formatLoginTime(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  return time + ", " + date;
}

export function DevAccountsPanel({ open, onClose }: DevAccountsPanelProps) {
  const {
    accounts,
    devName,
    devRole,
    devAccountId,
    isDevAuthenticated,
    canManageRoster: canManage,
    canSeeLastSeen: canSeeLast,
    addAccount,
    removeAccount,
  } = useDevAuth();

  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState<DevRole>("employee");
  const [revealId, setRevealId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mayManage = canManageRoster(devRole);
  const maySeeLast = canSeeLastSeen(devRole);

  const resetForm = () => {
    setNewName("");
    setNewPassword("");
    setConfirmPassword("");
    setNewRole("employee");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mayManage) {
      toast.error("Apenas Gerentes, Chefes e Desenvolvedores podem adicionar contas.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }
    const result = addAccount({
      name: newName,
      password: newPassword,
      role: newRole,
    });
    if (result.ok) {
      toast.success(
        `Conta "${newName.trim()}" adicionada como ${roleLabel(newRole)}.`,
      );
      resetForm();
    } else {
      toast.error(result.reason ?? "Não foi possível adicionar.");
    }
  };

  const handleRemove = (acc: DevAccount) => {
    if (!mayManage) {
      toast.error("Apenas Gerentes, Chefes e Desenvolvedores podem remover contas.");
      return;
    }
    if (
      !window.confirm(
        `Remover a conta "${acc.name}" (${roleLabel(acc.role)})?\nEsta ação não pode ser revertida.`,
      )
    ) {
      return;
    }
    const result = removeAccount(acc.id);
    if (result.ok) {
      toast.success(`Conta "${acc.name}" removida.`);
      if (revealId === acc.id) setRevealId(null);
    } else {
      toast.error(result.reason ?? "Não foi possível remover.");
    }
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SessionIcon = devRole ? ROLE_VISUALS[devRole].Icon : null;

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
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-md flex-col border-l border-border/40 bg-card shadow-2xl"
            aria-label="Equipa e permissões"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626]/15 ring-1 ring-[#DC2626]/30">
                  <Users className="h-5 w-5 text-[#DC2626]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    Equipa & Permissões
                  </h3>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {`${accounts.length} ${accounts.length === 1 ? "conta ativa" : "contas ativas"} · ${accounts.filter((a) => a.role !== "employee").length} com privilégios`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Active session */}
            {isDevAuthenticated && (
              <div className="border-b border-border/40 bg-secondary/30 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Sessão atual
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <p className="text-sm font-semibold text-foreground">
                    {devName}
                  </p>
                  {devRole && SessionIcon && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ROLE_VISUALS[devRole].badgeClass}`}
                    >
                      <SessionIcon className="h-2.5 w-2.5" />
                      {roleLabel(devRole)}
                    </span>
                  )}
                  {!mayManage && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      <Lock className="h-2.5 w-2.5" /> só leitura
                    </span>
                  )}
                  {mayManage && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700 dark:bg-green-500/20 dark:text-green-300">
                      <ShieldCheck className="h-2.5 w-2.5" /> gestão
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Account list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Contas
              </p>
              {accounts.map((acc) => {
                const {
                  Icon: RoleIcon,
                  badgeClass,
                  avatarClass,
                  iconClass,
                  label: roleLabelText,
                } = ROLE_VISUALS[acc.role];

                const isCurrentUser =
                  isDevAuthenticated && acc.id === devAccountId;
                const canDeleteThis =
                  mayManage &&
                  !isCurrentUser &&
                  accounts.length > 1 &&
                  canRemoveAccount(devRole, acc.role);
                const isLastPrivileged =
                  acc.role !== "employee" &&
                  accounts.filter(
                    (a) =>
                      a.id !== acc.id && a.role !== "employee",
                  ).length === 0;
                const isRevealed = revealId === acc.id;

                const actorCanSeeHistory = canSeeLoginHistory(
                  devRole,
                  devAccountId,
                  acc.role,
                  acc.id,
                );
                const hasHistory = acc.loginHistory.length > 0;
                const isHistoryExpanded = expandedHistory.has(acc.id);
                const lastSeenAt = acc.loginHistory.length > 0
                  ? acc.loginHistory[acc.loginHistory.length - 1]
                  : undefined;

                return (
                  <div
                    key={acc.id}
                    className="flex items-start gap-2 rounded-xl border border-border/40 bg-background px-3 py-2.5"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${avatarClass}`}
                    >
                      <RoleIcon className={`h-4 w-4 ${iconClass}`} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {acc.name}
                        </p>
                        {isCurrentUser && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700 dark:bg-green-500/20 dark:text-green-300">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            ativo
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}
                        >
                          <RoleIcon className="h-2.5 w-2.5" />
                          {roleLabelText}
                        </span>
                      </div>
                      {/* Only show password line to developer */}
                      {devRole === "developer" && (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {isRevealed
                            ? acc.password
                            : "\u2022".repeat(Math.min(acc.password.length, 12))}
                        </p>
                      )}
                      {/* Last session line — role-scoped */}
                      {canSeeLastSeenOf(devRole, acc.role) && lastSeenAt !== undefined && (
                        <p className="font-mono text-[10px] text-muted-foreground/80">
                          Última sessão: {formatLoginTime(lastSeenAt)}
                        </p>
                      )}
                      {canSeeLastSeenOf(devRole, acc.role) && lastSeenAt === undefined && (
                        <p className="font-mono text-[10px] text-muted-foreground/60">
                          Última sessão: Nunca
                        </p>
                      )}

                      {/* Login history — only if actor can see it AND there is history */}
                      {actorCanSeeHistory && hasHistory && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleHistory(acc.id)}
                            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Clock className="h-3 w-3" />
                            Histórico de acessos ({acc.loginHistory.length})
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                isHistoryExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isHistoryExpanded && (
                            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-border/40 ml-0.5">
                              {acc.loginHistory.slice().reverse().map((ts, i) => (
                                <p
                                  key={i}
                                  className="pl-2 text-[10px] font-mono text-muted-foreground/80"
                                >
                                  {formatLoginTime(ts)}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Show lock notice for managers when they can't see boss/developer history */}
                      {!actorCanSeeHistory &&
                        maySeeLast &&
                        devRole === "manager" &&
                        (acc.role === "boss" || acc.role === "developer") &&
                        acc.id !== devAccountId && (
                          <p className="font-mono text-[10px] text-muted-foreground/50 italic">
                            Histórico reservado à gerência superior
                          </p>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-0.5">
                      {/* Password reveal — only for Developer */}
                      {devRole === "developer" && (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealId((cur) => (cur === acc.id ? null : acc.id))
                          }
                          title={
                            isRevealed
                              ? "Esconder palavra-passe"
                              : "Mostrar palavra-passe"
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          aria-label={
                            isRevealed
                              ? "Esconder palavra-passe"
                              : "Mostrar palavra-passe"
                          }
                        >
                          {isRevealed ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(acc)}
                        disabled={!canDeleteThis}
                        title={
                          !mayManage
                            ? "Apenas Gerentes, Chefes e Desenvolvedores podem remover contas"
                            : isCurrentUser
                              ? "Saia da sessão primeiro para remover a sua própria conta"
                              : isLastPrivileged
                                ? "Não é possível remover o último utilizador com privilégios"
                                : !canRemoveAccount(devRole, acc.role)
                                  ? `Não tem permissão para remover um ${roleLabel(acc.role)}`
                                  : accounts.length === 1
                                    ? "Tem de existir pelo menos uma conta"
                                    : `Remover ${roleLabel(acc.role)}`
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remover conta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add-account form */}
            <form
              onSubmit={handleAdd}
              className="border-t border-border/40 bg-secondary/20 px-5 py-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <UserPlus
                  className={`h-4 w-4 ${
                    mayManage ? "text-[#DC2626]" : "text-muted-foreground"
                  }`}
                />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
                  Adicionar nova conta
                </p>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    mayManage
                      ? "bg-secondary text-muted-foreground"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  }`}
                >
                  {!mayManage && <Lock className="h-2.5 w-2.5" />}
                  {mayManage ? (
                    <>
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Permissão ativa
                    </>
                  ) : (
                    "Apenas leitura"
                  )}
                </span>
              </div>

              {!mayManage && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Só Gerentes, Chefes e Desenvolvedores podem adicionar e remover
                    contas. Para alterar a equipa peça a um colega com
                    privilégios.
                  </p>
                </div>
              )}

              <fieldset disabled={!mayManage} className="space-y-2.5">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome"
                  className="h-10 rounded-md border-border/40 bg-background disabled:opacity-50"
                  autoComplete="off"
                />
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Palavra-passe (mín. 4)"
                  className="h-10 rounded-md border-border/40 bg-background font-mono disabled:opacity-50"
                  autoComplete="new-password"
                />
                <Input
                  type="text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar palavra-passe"
                  className="h-10 rounded-md border-border/40 bg-background font-mono disabled:opacity-50"
                  autoComplete="new-password"
                />
                {/* Role selector */}
                <div
                  role="radiogroup"
                  aria-label="Nível de acesso"
                  className="flex flex-wrap gap-1.5 pt-0.5"
                >
                  {ROLE_OPTIONS.map(({ key, Icon, label }) => {
                    const active = newRole === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setNewRole(key)}
                        className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          active
                            ? key === "developer"
                              ? "bg-blue-600 text-white"
                              : key === "manager"
                                ? "bg-emerald-600 text-white"
                                : key === "boss"
                                  ? "bg-purple-600 text-white"
                                  : "bg-secondary text-foreground ring-1 ring-border"
                            : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="submit"
                  className="h-10 w-full rounded-md bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#ef4444] disabled:opacity-50"
                  disabled={
                    !mayManage ||
                    !newName.trim() ||
                    newPassword.length < 4 ||
                    newPassword !== confirmPassword
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar como{" "}
                  {roleLabel(newRole)}
                </Button>
                {newPassword && newPassword !== confirmPassword && (
                  <p className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                    <Lock className="h-3 w-3" />
                    As palavras-passe não coincidem.
                  </p>
                )}
              </fieldset>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}
