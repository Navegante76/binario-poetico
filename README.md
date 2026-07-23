# A Sua Oficina · Demo Site (NV76 HUB)

**Site institucional e plataforma de gestão — projeto de demonstração.**

Esta é uma Single Page Application construída em **React 19 + TypeScript + Vite 7 + Convex + Tailwind 4 + framer-motion 12**, originalmente desenhada como website de captação para uma oficina automóvel multimarcas, mas atualmente configurada como **demo genérica** com dados fictícios — o cliente original não chegou a comprar a versão final, por isso o sistema foi convertido para showcase técnico.

Serve três propósitos sobrepostos:

1. **Landing Page pública** com 10+ secções, conversão direta para WhatsApp / telefone / formulário de orçamento.
2. **Developer Mode oculto** (autenticação por roles) que permite editar copy, gerir roster, responder a pedidos e exportar o projeto em ZIP, sem necessidade de CMS tradicional.
3. **Backend Convex** (única peça verdadeiramente serverless) que recolhe submissões do formulário com rate-limit (3 / 10 min por IP).

Estado **atual** dos dados de demo (a alterar livremente via Dev Mode):

| Campo | Valor demo |
|---|---|
| Marca (layer de conteúdo) | **A Sua Oficina** · Oficina Automóvel Multimarcas |
| Logótipo (layer visual, navbar) | **NV76 HUB** (SVG round badge em `public/images/nv76-hub-logo.svg`) |
| Localização | Fiães, Santa Maria da Feira (mantida) |
| Telemóvel | **928 029 314** (`+351928029314`) |
| Email | `geral@asuaficina.pt` |
| Mensagem WhatsApp pré-preenchida | `olá pedro quanto custa o site?` |

> **Nota de coerência**: a `data/site-content.ts` diz "A Sua Oficina", mas o logótipo da Navbar é o badge NV76 HUB. Esta camada mista é intencional enquanto o projeto é demo — ao converter para cliente real, basta alinhar ambos.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Técnica](#2-stack-técnica)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Arquitetura](#4-arquitetura)
5. [Design System](#5-design-system)
6. [Rotas e Âncoras](#6-rotas-e-âncoras)
7. [Funcionalidades Chave](#7-funcionalidades-chave)
8. [Otimização Mobile/Tablet](#8-otimização-mobiletablet)
9. [Convenções de Código](#9-convenções-de-código)
10. [Scripts NPM](#10-scripts-npm)
11. [Notas Importantes (WebContainer)](#11-notas-importantes-webcontainer)
12. [O que ainda podemos melhorar](#12-o-que-ainda-podemos-melhorar)
13. [Manutenção deste README](#13-manutenção-deste-readme)

---

## 1. Visão Geral

99% do estado do site vive em **localStorage** com chaves dedicadas (ver § 11). Convex só entra quando há uma ação concreta do utilizador (submissão de formulário). Edição inline de qualquer texto é possível em Dev Mode; imagens estão **read-only** por decisão de produto.

### Single Source of Truth do estado

```
┌────────────────────┐     ┌─────────────────────────┐     ┌────────────────────┐
│ DEFAULT_CONTENT    │ ──▶ │ DevProvider (Context)   │ ──▶ │ useContent()       │
│ (data/site-content │     │ • deepMerge + migrate   │     │ (componentes con-  │
│  .ts)              │     │ • localStorage rehydrate│     │  sumem o content)  │
│                    │     │ • normaliseContent fix  │     │                    │
└────────────────────┘     └─────────────────────────┘     └────────────────────┘
                                  │
                                  ▼
                          localStorage (chaves renomeadas para "oficina_*"):
                          • oficina_site_content         (Content unificado)
                          • oficina_dev_accounts_v2      (Roster Dev)
                          • oficina_dev_auth             (Sessão atual)
                          • oficina_dev_notes            (DevNotes)
                          • oficina_submissions_<uid>    (Cache UI de inbox)
```

> Migração automática do schema antigo (`binario_*`) → novo (`oficina_*`) acontece quando se clica em **Reset** na DevToolbar. Sem reset, dados antigos ficam órfãos e podem causar crashes (ver § 12.5).

---

## 2. Stack Técnica

### Frontend

| Pacote | Versão | Papel |
|---|---|---|
| `react` | ^19.2.0 | UI base com hooks |
| `react-dom` | ^19.2.0 | Renderização DOM |
| `react-router` | ^7.10.0 | Roteamento cliente |
| `next-themes` | ^0.4.6 | Modo claro/escuro |
| `react-hook-form` | ^7.67.0 | Gestão de formulários |
| `@hookform/resolvers` | ^5.2.2 | Ponte RHF ↔ Zod |
| `@marsidev/react-turnstile` | ^1.5.3 | Cloudflare Turnstile anti-bot |
| `react-intersection-observer` | ^10.0.0 | Viewport triggers (counters) |
| `react-resizable-panels` | ^3.0.6 | Layouts redimensionáveis |

### Backend & Persistência

| Pacote | Versão | Papel |
|---|---|---|
| `convex` | ^1.30.0 | Backend serverless + DB reativa |
| `@convex-dev/auth` | ^0.0.90 | Autenticação integrada em Convex |
| `axios` | ^1.13.2 | HTTP client |
| `jszip` | ^3.10.1 | Export client-side em ZIP (dev only) |
| `@vly-ai/integrations` | ^0.6.12 | SDK Freebuff (auth Vly + environments) |

### Styling & UI

| Pacote | Versão | Papel |
|---|---|---|
| `tailwindcss` | ^4.1.17 | Utility-first CSS |
| `@tailwindcss/vite` | ^4.1.17 | Plugin nativo Vite |
| `tailwind-merge` | ^3.4.0 | Merge seguro de classes |
| `clsx` | ^2.1.1 | Class composition |
| `class-variance-authority` | ^0.7.1 | Variantes (Button, Badge…) |
| `@radix-ui/react-*` | v1.x | Primitivas UI acessíveis (shadcn/ui) |
| `embla-carousel-react` | ^8.6.0 | Carrossel (testemunhos) |
| `vaul` | ^1.1.2 | Drawer mobile-friendly |
| `sonner` | ^2.0.7 | Notificações toast |
| `recharts` | ^2.15.4 | Gráficos no dashboard |
| `react-day-picker` | 9.13.0 | Date picker (dashboard) |
| `cmdk` | ^1.1.1 | Command palette |
| `input-otp` | ^1.4.2 | Input OTP (auth flows) |

### Animações

| Pacote | Versão | Papel |
|---|---|---|
| `framer-motion` | ^12.23.25 | Animações declarativas (parallax, pulse, fade) |
| `tw-animate-css` | ^1.4.0 | Animações CSS geradas pelo Tailwind |

### Ícones

| Pacote | Versão | Papel |
|---|---|---|
| `lucide-react` | ^0.555.0 | Biblioteca principal (~1000 ícones) |
| `src/lib/icon-registry.tsx` | — | 40+ marcas de social via `DynamicIcon` |
| `src/components/icons/WhatsAppIcon.tsx` | — | SVG oficial WhatsApp inline |

### Tooling

| Pacote | Versão | Papel |
|---|---|---|
| `vite` | ^7.2.6 | Bundler / dev server |
| `@vitejs/plugin-react` | ^5.1.1 | JSX + Fast Refresh |
| `typescript` | ~5.9.3 | Tipagem estática (`strict`) |
| `eslint` + `typescript-eslint` | ^9.x | Linting |
| `prettier` | ^3.7.3 | Formatação |
| `zod` | ^4.1.13 | Validação de schemas |

### Domínio / Utilities

| Pacote | Versão | Papel |
|---|---|---|
| `hono` | ^4.10.7 | HTTP router (rotas internas) |
| `date-fns` | ^4.1.0 | Manipulação de datas |
| `@oslojs/crypto` | ^1.0.1 | Crypto utilities (auth flows) |
| `@jridgewell/trace-mapping` | ^0.3.31 | Utilitário de stack traces |
| `@zumer/snapdom` | ^2.0.1 | DOM → imagem (dev previews) |

---

## 3. Estrutura de Pastas

```
/
├── index.html                  # HTML root + Poppins font + meta tags (sem OG/Twitter ainda — ver §12)
├── vite.config.ts              # Config Vite + plugin React + plugin Tailwind + HMR=false
├── tsconfig.json               # TS strict, paths "@/*" → "src/*"
├── convex.json                 # Schema do Convex (auth + formSubmissions)
├── package.json                # Dependências + scripts
├── README.md                   # ← este ficheiro (SSOT do projeto)
├── public/
│   └── images/
│       ├── nv76-hub-logo.svg   # Logótipo NV76 HUB em badge redondo (800×800)
│       ├── hero.svg            # (reservado para migração)
│       ├── about-main.svg      # (reservado)
│       └── gallery/01..08-*.svg # 8 placeholders SVG para a galeria
│
└── src/
    ├── main.tsx                # Bootstrap: StrictMode + DevProvider + Router
    ├── App.tsx                 # Router + layout raiz
    ├── index.css               # Tailwind + tokens :root/.dark + utilities
    ├── instrumentation.tsx     # (reservado)
    │
    ├── pages/
    │   ├── Landing.tsx         # Composição completa da landing page
    │   ├── Auth.tsx            # (Convex Auth — wrapped)
    │   ├── DevLogin.tsx        # Login standalone (alternativa ao modal)
    │   └── NotFound.tsx        # 404 fallback
    │
    ├── components/
    │   ├── icons/
    │   │   └── WhatsAppIcon.tsx
    │   │
    │   ├── ui/                 # Componentes shadcn/ui (Radix wrapped) — ~50 ficheiros
    │   │   ├── button.tsx · card.tsx · form.tsx · input.tsx · textarea.tsx · label.tsx
    │   │   ├── dialog.tsx · sheet.tsx · drawer.tsx · accordion.tsx · tabs.tsx
    │   │   ├── dropdown-menu.tsx · tooltip.tsx · popover.tsx · hover-card.tsx
    │   │   ├── alert.tsx · alert-dialog.tsx · toast (sonner)
    │   │   ├── avatar.tsx · badge.tsx · checkbox.tsx · switch.tsx · toggle.tsx · slider.tsx
    │   │   ├── radio-group.tsx · select.tsx · separator.tsx
    │   │   ├── progress.tsx · skeleton.tsx · spinner.tsx
    │   │   ├── aspect-ratio.tsx · scroll-area.tsx · pagination.tsx
    │   │   ├── carousel.tsx · breadcrumb.tsx · context-menu.tsx · menubar.tsx
    │   │   ├── navigation-menu.tsx · chart.tsx · calendar.tsx · command.tsx
    │   │   ├── field.tsx · input-group.tsx · input-otp.tsx · item.tsx · kbd.tsx
    │   │   ├── resizable.tsx · sidebar.tsx · sonner.tsx · table.tsx · toggle-group.tsx
    │   │   ├── empty.tsx · button-group.tsx
    │   │   └── animated-counter.tsx     # Counter com IntersectionObserver
    │   │
    │   ├── landing/            # Secções da Landing Page (10 secções + animações)
    │   │   ├── animations.tsx            # FadeUp, StaggerContainer, StaggerItem
    │   │   ├── effects.tsx               # Hooks utilitários de animação
    │   │   ├── Navbar.tsx                # Glassmorphism no scroll + NV76 HUB logo
    │   │   ├── Hero.tsx                  # CTAs, rating, parallax ISOLADO em sub-componente
    │   │   ├── About.tsx                 # Highlights + parallax
    │   │   ├── Services.tsx              # 13 serviços + shine effect
    │   │   ├── Features.tsx              # 8 diferenciais + shine
    │   │   ├── Stats.tsx                 # Animated counters
    │   │   ├── Gallery.tsx               # Grid 4 cols + Lightbox (touch + keyboard)
    │   │   ├── Lightbox.tsx              # Full-screen com teclado ←→ Esc
    │   │   ├── Reviews.tsx               # 6 testemunhos
    │   │   ├── FAQ.tsx                   # Accordion + WhatsApp CTA
    │   │   ├── Contact.tsx               # Form RHF + Zod + Turnstile
    │   │   ├── CtaStrip.tsx              # Faixa final com parallax ISOLADO em sub-componente
    │   │   ├── Footer.tsx                # Nav + Contacts + Socials (coerção defensiva)
    │   │   ├── WhatsAppButton.tsx        # Botão flutuante (sem blur em mobile)
    │   │   ├── BackToTop.tsx             # (Sem AnimatePresence em mobile)
    │   │   └── SectionDivider.tsx        # SVGs curve/wave entre secções
    │   │
    │   ├── dev/                # Developer Mode — ativado por auth local
    │   │   ├── DevToolbar.tsx            # Barra fixa no topo quando autenticado
    │   │   ├── DevEditable.tsx           # Edição inline de texto (DevMode)
    │   │   ├── DevEditableImage.tsx      # Read-only renderer (edição desativada)
    │   │   ├── DevEditableIcon.tsx       # Edição de ícones (lucide/brand)
    │   │   ├── DevEditableLink.tsx       # Edição de URLs + preview
    │   │   ├── DevLoginModal.tsx         # Popup de autenticação 4 roles
    │   │   ├── DevAccountsPanel.tsx      # Gestão de roster (4 roles)
    │   │   ├── DevExportPanel.tsx        # Export do projeto em ZIP (só developer)
    │   │   ├── SubmissionsPanel.tsx      # Inbox de orçamentos Convex
    │   │   └── DevNotes.tsx              # Notas pessoais do dev
    │   │
    │   └── LogoDropdown.tsx     # Dropdown no logo (dev mode only)
    │
    ├── convex/                 # Backend Convex
    │   ├── _generated/         # NÃO editar: gerado por `npx convex dev`
    │   ├── auth.config.ts      # Schema de providers de auth
    │   ├── auth.ts             # Configuração base de auth
    │   ├── auth/emailOtp.ts    # Fluxo OTP por email
    │   ├── users.ts            # Helpers de user store
    │   ├── formSubmissions.ts  # submitQuoteForm + rate-limit (3/10min/IP)
    │   ├── schema.ts           # Schema das tabelas
    │   └── http.ts             # HTTP routes
    │
    ├── data/
    │   └── site-content.ts     # Tipo SiteContent + DEFAULT_CONTENT (dados fictícios)
    │
    ├── hooks/
    │   ├── use-mounted.ts      # SSR safety (devolve true após mount)
    │   ├── use-device-motion.ts # Deteta mobile + prefers-reduced-motion (ver §8)
    │   ├── use-mobile.ts       # Tailwind responsive hook
    │   └── use-auth.ts         # Wrapper de auth para componentes
    │
    ├── lib/
    │   ├── dev-auth.tsx        # Provider com 4 roles + LocalStorage + Permissions
    │   ├── links.tsx           # resolveLinks helper (tel:, mailto:, wa.me) — coerção defensiva
    │   ├── smooth-scroll.ts    # easeOutCubic 1500ms via requestAnimationFrame
    │   ├── icon-registry.tsx   # BRAND_ICON_NAMES + DynamicIcon (40+ brands)
    │   ├── image-upload.ts     # JPEG re-encode 1600px @ 0.82 (data URLs leves)
    │   ├── form-submissions.ts # useSubmitForm + useSubmissions + formatters PT
    │   ├── utils.ts            # cn() helper
    │   └── vly-integrations.ts # Wrapper do SDK Freebuff
    │
    └── vite-env.d.ts
```

---

## 4. Arquitetura

### 4.1 Fluxo de Conteúdo (camadas)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER 1 — Dados puros (SSOT inicial)                                     │
│   src/data/site-content.ts → DEFAULT_CONTENT                             │
└──────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER 2 — DevProvider (Context API em src/lib/dev-auth.tsx)              │
│   • Por mount: rehydrate de localStorage (chave oficina_site_content)    │
│   • Aplica DEEP MERGE com DEFAULT_CONTENT (preserva novas chaves)        │
│   • Aplica normaliseContent() (repara assets.gallery corrompido)         │
│   • Expõe: { content, updateContent(path, value), resetContent() }       │
└──────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER 3 — Componentes                                                    │
│   useContent() lê o estado corrente                                      │
│   DevEditable envolve texto editável (DevMode E canEditContent)          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Autenticação de Developer (4 Roles)

Hierarquia (`ROLE_RANK`, menor = mais privilégio):

| Role | Rank | Pode editar content? | Pode ver loginHistory de | Pode remover |
|---|---|---|---|---|
| `developer` | 1 | ✅ | Todos | Qualquer (até `developer`) |
| `manager` | 2 | ✅ | employee + manager + self | até `manager` |
| `boss` | 3 | ✅ | Todos | até `boss` |
| `employee` | 4 | ❌ | ninguém | nada |

**Seed accounts (preservadas na demo)**:

```ts
const seed = [
  { name: "Pedro Pais", password: "NV76_hub", role: "manager" },  // ← conta principal
  { name: "Gerente",    password: "1234",       role: "manager" },
  { name: "Func",       password: "1234",       role: "employee" },
];
```

`canEditContent(role)` → `true` quando role !== `"employee"`. Controla se o UI mostra os wrappers `DevEditable`.

> **Nota de segurança**: as passwords seed estão em texto simples em `src/lib/dev-auth.tsx`. Em produção, devem ser哈希 + armazenadas em Convex, não em localStorage.

### 4.3 Fluxo de Submissão de Orçamento

```
┌────────────────┐  RHF + Zod   ┌────────────────────┐  useAction  ┌─────────────────────────┐
│ Contact.tsx    │ ───────────▶ │ useSubmitForm      │ ──────────▶ │ Convex mutation         │
│ • nome         │              │ (lib/form-         │             │ formSubmissions         │
│ • telefone     │              │  submissions.ts)   │             │ .submitQuoteForm        │
│ • email        │              └────────────────────┘             │                         │
│ • marca        │                       │                        │ Rate limit:             │
│ • modelo       │                       ▼                        │ 3 / 10 min por IP       │
│ • mensagem     │              ┌────────────────────┐             │                         │
│ • Turnstile    │              │ Turnstile token    │             │ Persistência:           │
│   token        │              │ (cloudflare)       │             │ Doc na DB + email hook  │
└────────────────┘              └────────────────────┘             └─────────────────────────┘
```

**Submissão passa sempre por Convex** — não há fallback localStorage. O rate-limit é a defesa contra floods.

### 4.4 Edição Inline (`DevEditable`)

`src/components/dev/DevEditable.tsx` recebe:
- `path`: dot-notation em `SiteContent` (ex: `"hero.titlePart1"`)
- `value`: texto atual

Em dev mode `&& canEditContent`: envolve texto numa `<span contenteditable>` que ao perder foco chama `updateContent(path, newText)`:

1. Constrói novo estado imutável via `setNested` (**preserva arrays** — nunca fazer spread dentro de array)
2. Persiste em `localStorage` (chave `oficina_site_content`)
3. PATCH opcional para `/api/dev-save` (só em ambientes com backend ativo)

### 4.5 Resolução de Links (`src/lib/links.tsx`)

`resolveLinks(links)` constrói `{ phoneHref, whatsAppHref, mailtoHref, mapEmbedUrl, mapSearchHref, socials, navAnchors, orcamentoAnchor }`. Todos os componentes consomem daqui — nunca constroem URLs localmente.

**Coerção defensiva** em vigor desde 2026-07-20:
```ts
socials: Array.isArray(links.socials) ? links.socials : [],
```
Prevê crashes quando `localStorage` tem dados de uma schema anterior (string, object, null) onde `??` não ativa mas `.filter()` rebentava.

---

## 5. Design System

### 5.1 Tipografia

- **Família**: Poppins (sans-serif) via `@fontsource/poppins` carregado globalmente. Fallback: `ui-sans-serif, system-ui, sans-serif`.
- **Feature setting global**: `font-feature-settings: "cv11", "ss01"` (alternates estilísticos do Poppins).
- **Letter-spacing em badges**: `tracking-[0.18em]` (uppercase).
- **Tamanhos**: escala nativa Tailwind. Em títulos usa-se tipicamente `text-3xl sm:text-4xl lg:text-5xl` com `font-semibold` + `tracking-tight`.

### 5.2 Cores

#### Brand (específicas do projeto, em `src/index.css`)
| Token | Valor |
|---|---|
| `--binario-navy` | `#0f172a` |
| `--binario-navy-soft` | `#1e293b` |
| `--binario-navy-deep` | `#020617` |
| `--binario-red` | `#dc2626` (CTAs de marca, destructive) |
| `--binario-red-hover` | `#ef4444` |
| `--binario-red-deep` | `#b91c1c` (Pressed, sombras profundas) |

#### Neutral (semânticas, em `:root` e `.dark`)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#0f172a` |
| `--foreground` | `#0f172a` | `#f8fafc` |
| `--card` | `#ffffff` | `#1e293b` |
| `--card-foreground` | `#0f172a` | `#f8fafc` |
| `--popover` | `#ffffff` | `#1e293b` |
| `--popover-foreground` | `#0f172a` | `#f8fafc` |
| `--muted` | `#f8fafc` | `#1e293b` |
| `--muted-foreground` | `#64748b` | `#94a3b8` |
| `--accent` | `#f1f5f9` | `#1e293b` |
| `--border` | `#e2e8f0` | `#334155` |
| `--input` | `#e2e8f0` | `#334155` |

#### Semantic
| Token | Light | Dark |
|---|---|---|
| `--primary` | `#0f172a` | `#ffffff` |
| `--primary-foreground` | `#ffffff` | `#0f172a` |
| `--secondary` | `#f1f5f9` | `#1e293b` |
| `--secondary-foreground` | `#0f172a` | `#f8fafc` |
| `--destructive` | `#dc2626` | `#dc2626` |
| `--ring` | `#0f172a` | `#dc2626` |

#### Chart (dashboards)
| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#0f172a` | `#dc2626` |
| `--chart-2` | `#dc2626` | `#3b82f6` |
| `--chart-3` | `#2563eb` | `#f59e0b` |
| `--chart-4` | `#f59e0b` | `#10b981` |
| `--chart-5` | `#10b981` | `#a855f7` |

#### Sidebar (Convex Auth UI)
| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `#ffffff` | `#0f172a` |
| `--sidebar-foreground` | `#0f172a` | `#f8fafc` |
| `--sidebar-primary` | `#0f172a` | `#dc2626` |
| `--sidebar-accent` | `#f1f5f9` | `#1e293b` |
| `--sidebar-border` | `#e2e8f0` | `#334155` |
| `--sidebar-ring` | `#0f172a` | `#dc2626` |

### 5.3 Border Radius

```css
--radius: 0.75rem;       /* base */
--radius-sm: 0.5rem;     /* base - 4px */
--radius-md: 0.625rem;   /* base - 2px */
--radius-lg: 0.75rem;    /* base */
--radius-xl: 1.0rem;     /* base + 4px */
```

Em uso: `rounded-2xl` (~1rem) padrão nas secções; `rounded-full` em CTAs e pills.

### 5.4 Breakpoints

Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

Exemplos comuns:
- `hidden sm:flex` (mostrar só em ≥sm)
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- `h-16 sm:h-20` (navbar)

### 5.5 Componentes UI base

Localização: `src/components/ui/`. Camada fina sobre Radix UI + Tailwind, padrão **shadcn/ui**.

Mais usados:
- `Button` (variantes: `default`, `destructive`, `outline`, `ghost`, `link`)
- `Card`, `Input`, `Textarea`, `Label`, `Form`, `Checkbox`, `Switch`
- `Dialog`, `Sheet`, `Drawer`, `Alert`, `Toast` (Sonner), `Tooltip`
- `Tabs`, `Accordion`, `Toggle`, `DropdownMenu`, `Select`, `Separator`
- `Badge`, `Avatar`, `Progress`, `Skeleton`, `Spinner`
- `animated-counter` (próprio)

> **Nota DX**: ~50 ficheiros de UI foram gerados via `npx shadcn@latest add ...`. Nem todos estão em uso (ver § 12.4).

### 5.6 Animações (framer-motion v12)

#### 5.6.1 Componentes reutilizáveis (`src/components/landing/animations.tsx`)

```tsx
export function FadeUp({ delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    />
  );
}
```

Padrão stagger:
```tsx
export function StaggerContainer({ children, className = "" }) { ... }
export function StaggerItem({ children, index = 0, className = "" }) { ... }
```

Em mobile, ambos reduzem: stagger delay 0.08→0.04s, FadeUp distance 28→12px, duração 0.7→0.45s.

#### 5.6.2 Easings aplicados
- **Hero/About**: `[0.22, 1, 0.36, 1]` (custom cubic-bezier)
- **Scroll**: `easeOutCubic` via `src/lib/smooth-scroll.ts` (1500ms desktop, 800ms mobile)

#### 5.6.3 Parallax
**Hero e CtaStrip têm parallax ISOLADO em sub-componentes** — o componente principal só renderiza `<HeroParallaxBg />` quando `!reduceMotion`. Isto evita que `useScroll()` do framer-motion subscreva eventos 60fps em mobile/token devices.

```tsx
// Em Hero.tsx:
{!reduceMotion && <HeroParallaxBg />}  // sub-componente com useScroll+useTransform
```

#### 5.6.4 Animated Counter (`src/components/ui/animated-counter.tsx`)

- Conta de 0 → valor em **1200 ms desktop** / **1000 ms mobile** com ease-out cubic.
- Dispara uma vez via `IntersectionObserver`.
- Suporta prefixo (`+`), sufixo (`★`) e decimais.

#### 5.6.5 Efeitos pulsados (CTAs, BackToTop, etc.)

```tsx
animate={{ scale: [1, 1.03, 1] }}
transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
```

Desativado em `reduceMotion`.

### 5.7 Custom Utility Classes (`src/index.css`)

| Util | Função |
|---|---|
| `.text-balance` | `text-wrap: balance` para títulos equilibrados |
| `.bg-hero-overlay` | Gradiente diagonal 135° do navy 92% → 40% |
| `.bg-grid-fade` | Malha 48px com máscara radial (grid sutil) |
| `.masonry` | Layout multi-coluna (2/3/4 cols responsivo) |
| `.scrollbar-none` | Esconde scrollbar (Chrome/Firefox) |
| `html { scroll-behavior: smooth }` | Smooth scroll nativo |

### 5.8 Estados Interativos

- **Seleção de texto**: `::selection { background: var(--binario-red); color: white }`
- **Cursor pointer**: Forçado em `button:not([disabled])` via regra base
- **Glassmorphism navbar**: Top transparente → `bg-white/85 backdrop-blur-xl` após scroll > 24px
- **Smooth scroll**: Animado em 1500 ms desktop / 800 ms mobile
- **Hover lift em cards**: `hover:-translate-y-1 hover:shadow-2xl` (Gallery)

### 5.9 Iconografia

- **Principal**: `lucide-react` (~1000 ícones SVG inline)
- **Brand registry**: 40+ marcas em `src/lib/icon-registry.tsx` expostas por `DynamicIcon`: `facebook`, `instagram`, `linkedin`, `tiktok`, `whatsapp`, `youtube`, `telegram`, `discord`, `spotify`, `pinterest`, `reddit`, `snapchat`, `twitch`, `threads`, `bluesky`, `mastodon`, etc.
- **WhatsApp oficial**: `src/components/icons/WhatsAppIcon.tsx` (inline, modos `brand` = disco verde completo + pequeno)
- **Socials editáveis** (dev mode): lista em `content.links.socials[]` renderizada no Footer

### 5.10 Padrão de CTA (botão de marca)

```tsx
<Button className="h-13 rounded-full bg-[#DC2626] px-7 text-base font-semibold
                   shadow-2xl shadow-red-900/40 hover:bg-[#ef4444]">
  Pedir Orçamento
  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
</Button>
```

- Cor base: `--binario-red` (`#dc2626`) — pill rounded-full com sombra vermelha profunda.
- Hover: `--binario-red-hover` (`#ef4444`) + translate-x na seta.
- Pulse: wrapper `motion.div` com `scale: [1, 1.03, 1]` em 2.2s loop (mobile: desativado).

### 5.11 Logótipo NV76 HUB (`public/images/nv76-hub-logo.svg`)

Badge redondo 800×800 com:
- Fundo escuro com padrão de pontos (`#1e3a8a` 0.45 opacity)
- Anel exterior gradient azul (`#3b82f6` → `#1e40af`, stroke 7px)
- Tipografia "NV76" com V azul gradient e accent cyan no "6"
- Tagline "— H U B —" centrado
- Tagline inferior "CRIATIVIDADE · SERVIÇOS · SOLUÇÕES" (letter-spacing 6)

Usado em `Navbar.tsx` com altura `h-12 sm:h-14 w-auto` (badge precisa de mais presença que logos text-based).

---

## 6. Rotas e Âncoras

| Rota | Página | Notas |
|---|---|---|
| `/` | `Landing.tsx` | Principal, todas as secções |
| `/dashboard` | (Convex Auth) | Privado, requer auth |
| `/login`, `/signup`, `/forgot-password` | (Convex Auth) | Fluxos públicos |
| `/dev-login` | `DevLogin.tsx` | Login standalone alternativo ao modal |
| `*` (catch-all) | `NotFound.tsx` | 404 fallback |

**Âncoras da landing** (alinhadas com `content.navbar.items[]`):

| Anchor | Secção |
|---|---|
| `#inicio` | Hero |
| `#servicos` | Services |
| `#sobre` | About |
| `#galeria` | Gallery |
| `#contactos` | Contact |
| `#orcamento` | Formulário de orçamento (dentro de Contact) |

Todas editáveis em `content.links.navAnchors` (dev mode).

---

## 7. Funcionalidades Chave

### Pública
- **Landing page completa** com 10 secções e conversões diretas para WhatsApp / telefone / formulário.
- **Botão flutuante WhatsApp** com ícone oficial SVG e animação pulse (mobile-friendly).
- **Lightbox na galeria** com navegação por teclado (`←` `→` `Esc`) e touch swipe.
- **Formulário de orçamento** com RHF + Zod, Turnstile anti-bot e rate-limit server-side.
- **Animações com scroll**: parallax, fade-up, stagger em listas.
- **Animated counters** no Hero com `IntersectionObserver`.
- **Glassmorphism navbar** ao rolar (com fallback sólido em mobile).
- **Animated CTA pulse** em todos os botões primários "Pedir Orçamento".
- **Secções separadas por curvas SVG** (`<SectionDivider>` com 5 variantes).
- **Botão "Voltar ao topo"** com progresso SVG circular.
- **Otimização mobile nativa** (ver § 8) — todas as animações pesadas são desativadas ou simplificadas em < lg.

### Developer Mode (autenticado)

- **DevToolbar** fixa no topo, com identidade, ações rápidas e logout.
- **Edição inline de texto** — qualquer string em qualquer secção via DevEditable.
- **Gestão de ícones / brands** (DynamicIcon swap).
- **Edição de URLs e links** com pré-visualização (DevEditableLink).
- **DevNotes** — bloco de notas pessoais guardadas em localStorage.
- **Gestão de roster** (DevAccountsPanel) — adicionar/remover contas (4 roles).
- **Submissions inbox** — listar pedidos de orçamento, marcar como read/archived.
- **Export ZIP do projeto** (apenas Developer).
- **Reset Content** — repõe `oficina_site_content` para DEFAULT_CONTENT (limpa localStorage corrupt).

> **Funcionalidade explicitamente removida**: edição de imagens / logo / mapa está **desativada para todos os roles**. `DevEditableImage.tsx` é apenas um renderer read-only. O painel Photos/Design foi eliminado da DevToolbar.

### Botões da DevToolbar (estado atual)

| Botão | Quem pode usar | Função |
|---|---|---|
| Save (Guardar) | Não-employee | Persiste alterações pendentes |
| Accounts (Users) | Não-employee | Abre DevAccountsPanel |
| Export (FolderArchive) | Só Developer | Export ZIP completo |
| Inbox (Submissions) | Todos autenticados | Lista pedidos Convex |
| Notes (NotebookPen) | Todos autenticados | DevNotes |
| Reset (RotateCcw) | Não-employee | Reset localStorage → DEFAULT_CONTENT |
| Logout | Todos autenticados | Termina sessão dev |

---

## 8. Otimização Mobile/Tablet

### 8.1 Hook central (`src/hooks/use-device-motion.ts`)

Expõe:
```ts
const { isMobile, isTouch, reduceMotion, prefersReducedMotion } = useDeviceMotion();
```

Deteta via `matchMedia` listeners com cleanup:
- `prefers-reduced-motion`: do SO (acessibilidade)
- `isMobile`: viewport < 768px
- `isTouch`: `pointer: coarse`

Reage a mudanças em tempo real (rotação, accessibility settings).

### 8.2 Princípios aplicados

| Princípio | Implementação |
|---|---|
| **Parallax desativado em mobile** | `<HeroParallaxBg />` e `<CtaParallaxBg />` só renderizam quando `!reduceMotion`. Zero `useScroll`/`useTransform` em mobile. |
| **Sem blur-3xl decorativo em mobile** | `Hero`, `Stats`, `CtaStrip`, `Gallery`, `Features` omitem os blobs azul/vermelho |
| **Sem canvas particles em touch** | `HeroParticles` em `effects.tsx` retorna `null` em touch devices |
| **Sem backdrop-blur em mobile** | `Navbar` usa fundo sólido em mobile; `backdrop-blur-xl` só em desktop |
| **Animações mais curtas** | Stagger 0.08→0.04s, FadeUp 28→12px, durações ~35% menores |
| **Sem AnimatePresence em show/hide** | `BackToTop` usa CSS opacity/visibility em vez de mount/unmount |
| **`will-change: transform` em GPU** | Gallery items declaram `will-change: transform` para layer GPU |
| **Sem pulse loop em CTAs mobile** | `animate-pulse` só em `!reduceMotion` |

### 8.3 Impacto cumulativo

Em mobile (< 768px):
- 🚫 0 parallax hooks subscritos
- 🚫 0 canvas particles
- 🚫 0 blur-3xl decorative
- 🚫 0 backdrop-blur
- 🚫 0 pulse animations
- ⚡ Stagger delays **50% menores**
- ⚡ Durações **~35% menores**

Em tablet (768-1023):
- Reduções parciais (parallax ainda desativado por `reduceMotion` se touch)

Em desktop (≥1024):
- Stack completa de animações.

---

## 9. Convenções de Código

| Convenção | Aplicação |
|---|---|
| **TypeScript estrito** | `~5.9.3`, sem `any` exceto em shims migratórios |
| **React 19** | Hooks-first, sem classes; `forwardRef` implícito |
| **Path alias `@/*`** | Mapeia para `src/*` em `tsconfig.json` |
| **Componentes funcionais** | Export nomeado para reutilizáveis |
| **shadcn/ui + Radix** | Componentes em `src/components/ui/`, sem estilo opinionated; variantes via `class-variance-authority` |
| **Estado local** | `useState` para UI volátil; `useReducer` em formulários múltiplos |
| **Estado partilhado** | Context API (`DevProvider`) |
| **SSR safety** | `useMounted` antes de portals ou libs síncronas |
| **localStorage como SSOT no dev mode** | Chaves: `oficina_site_content`, `oficina_dev_accounts_v2`, `oficina_dev_auth`, `oficina_dev_notes`, `oficina_submissions_<uid>` |
| **Defensiva** | `Array.isArray(x) ? x : []` ao iterar dados vindos de localStorage/Convex |
| **`setNested` imutável** | Preserva arrays via `.map()` no item tocado; nunca spread dentro de array |
| **`normaliseContent` no load** | Repara assets.gallery corrompido |
| **deepMerge no load** | Top-level merge de objetos; arrays são totalmente substituídos |
| **Formulários** | `react-hook-form` + `zod` + `useForm({ resolver: zodResolver })` |
| **Anti-bot** | Turnstile quando `VITE_TURNSTILE_SITE_KEY` definido |
| **Submissões** | Sempre via `useAction(api.formSubmissions.submitQuoteForm)` |
| **Permissões** | Helpers `canManageRoster`, `canSeeLoginHistory`, `canRemoveAccount` em `src/lib/dev-auth.tsx` |
| **HMR desativado** | `server.hmr: false` em `vite.config.ts` (preservado pelo Freebuff WebContainer) |
| **Linter** | `eslint` + `typescript-eslint` + `eslint-config-prettier` |
| **Formatação** | `prettier --write .` |

---

## 10. Scripts NPM

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia Vite dev server (HMR desativado) |
| `npm run build` | `tsc -b && vite build` (build de produção) |
| `npm run lint` | `eslint .` (tipo-aware lint) |
| `npm run format` | `prettier --write .` (reformat global) |
| `npm run preview` | `vite preview` (serve o bundle de produção) |
| `npx convex dev --once` | (Backend) Sincroniza schema + funções |
| `npx tsc -b --noEmit` | Typecheck sem emitir JS |

### Validação obrigatória

- **Frontend only**: `npx tsc -b --noEmit`
- **Backend (`src/convex/*`)**: `npx convex dev --once && npx tsc -b --noEmit`
- **Cache Vite stuck**: `rm -rf node_modules/.vite`

---

## 11. Notas Importantes (WebContainer)

Este projeto corre num **Freebuff WebContainer in-browser** — não numa VM. Implicações:

| Item | Nota |
|---|---|
| **Bun NÃO está instalado** | Usar sempre `npm`/`npx`/`node`. Não usar `bun`, `bunx`, `bun install`. |
| **HMR desativado** | `vite.config.ts` define `server.hmr: false` — preserva este valor! |
| **Cache Vite em `node_modules/.vite`** | Limpar com `rm -rf node_modules/.vite` se o preview não refletir mudanças |
| **localStorage 5MB quota** | `oficina_site_content` pode crescer com fotos (data URLs); popup avisa quando excede |
| **Convex deploy** | `npx convex dev --once` autentica com `CONVEX_DEPLOY_KEY` em ambiente. Não correr sem `--once`. |
| **Nunca editar `src/convex/_generated/*`** | Regenerar com `npx convex dev --once`. |
| **WebContainer: str_replace intermitente** | A reescrita de ficheiros via `str_replace` reporta sucesso mas pode não persistir. Em caso de dúvida, use `write_file` e verifique com `read_files`. |
| **Projeto dentro de root `/`** | Sem a estrutura `/home/daytona/codebase`. |

### Chaves de localStorage (referência)

| Chave | Conteúdo | Tamanho típico |
|---|---|---|
| `oficina_site_content` | `SiteContent` completo (default + overrides) | < 10 KB sem imagens |
| `oficina_dev_accounts_v2` | Array de `DevAccount` (com loginHistory) | < 5 KB |
| `oficina_dev_auth` | `{ currentUserId, role, loggedInAt }` | < 1 KB |
| `oficina_dev_notes` | String de notas (markdown livre) | < 50 KB |
| `oficina_submissions_<uid>` | UI cache de submissions inbox | < 10 KB |

---

## 12. O que ainda podemos melhorar

Lista priorizada de melhorias identificadas nesta análise. **⚠️ = risco real / bug latente** · **💡 = polish / DX**.

### 12.1 Segurança (⚠️ alto)

1. ⚠️ **Passwords em texto simples** — `src/lib/dev-auth.tsx` armazena passwords seed sem hash. Mover para bcrypt + Convex antes de produção.
2. ⚠️ **Sem CSP** — adicionar `Content-Security-Policy` no `index.html` para bloquear scripts inline não confiáveis.
3. 💡 **Strict-Transport-Security / Permissions-Policy** — preparar headers via Vite plugin ou backend edge function.
4. ⚠️ **localStorage acessível a qualquer JS** — se houver risco de XSS, reconsiderar mover dados sensíveis para `httpOnly` cookies via Convex.

### 12.2 Performance (💡 médio)

5. 💡 **Lazy load below-the-fold secções** — `Landing.tsx` importa todas as secções eagerly. Usar `React.lazy` + `Suspense` para Reviews/FAQ/Contact/Footer.
6. 💡 **Bundle analysis** — correr `npx vite-bundle-visualizer` para identificar lib sobressalente (já existe `recharts` pesado que talvez só se use no dashboard).
7. 💡 **Image optimization** — substituir SVGs `1oficina-mecanicos.svg` etc. (11 ficheiros em `public/images/`) por `<img loading="lazy">` ou converter para componentes React inline (bundle, não requests).
8. 💡 **Code split `icon-registry`** — os 40+ brand SVGs devem entrar via dynamic import sob demanda.

### 12.3 SEO (💡 alto impacto)

9. 💡 **Open Graph + Twitter Card meta tags** — `index.html` não tem `og:title`, `og:description`, `og:image`, `og:type`. Crítico para partilha em WhatsApp/Facebook/LinkedIn.
10. 💡 **JSON-LD LocalBusiness schema** — adicionar `<script type="application/ld+json">` com morada, telefone, horário, rating. Melhora rich results no Google.
11. 💡 **Canonical URL + sitemap.xml + robots.txt** — necessários para indexação real em produção.
12. 💡 **`meta description` dinâmica** — atualmente está hardcoded em `index.html`; ler de `content.seo.description` via `<Helmet>` ou renderização SSR (se migrar para Astro/Next).

### 12.4 Qualidade de Código / DX (💡)

13. 💡 **Componentes UI mortos** — ~40 ficheiros em `src/components/ui/` não são importados (verificar via `code_searcher`); remover para reduzir ruído.
14. 💡 **Testes** — não há setup de testes. Mínimo: smoke test do fluxo `Contact.tsx` (RHF + Zod) e do `resolveLinks` (URLs bem formadas).
15. 💡 **Auto-migração `oficina_*` → se renomear chaves** — adicionar `migrateLocalStorage()` que detecta chaves antigas e migra transparentemente, sem requerer Reset.
16. 💡 **Monitor de erros** — integrar Sentry/PostHog no `main.tsx`. Hoje um crash só aparece no DevTools.
17. 💡 **Error Boundary** — adicionar `<ErrorBoundary>` em volta de cada secção da landing; um crash isolado não derruba a página toda.

### 12.5 Acessibilidade (💡)

18. 💡 **Skip-to-content link** — adicionar `<a href="#inicio" className="sr-only focus:not-sr-only ...">` no topo do `<body>` para utilizadores de teclado/screenreader.
19. 💡 **Focus management em modais** — DevLoginModal / SubmissionsPanel devem prender focus enquanto abertos e devolve-lo ao trigger.
20. 💡 **Contraste WCAG AA** — bg vermelho (`#dc2626`) + texto branco atinge 4.83:1 (AA pass em texto grande). Verificar nos botões pequenos.
21. 💡 **`prefers-reduced-motion` global** — além de `useDeviceMotion`, considerar adicionar `@media (prefers-reduced-motion: reduce)` em `index.css` para desativar todas as animações CSS automáticas.

### 12.6 Funcional / Polish (💡)

22. 💡 **PWA / Service Worker** — adicionar `manifest.json` + workbox para instalação offline. Casa em especialmente bem com tema + próximas visitas.
23. 💡 **i18n PT/EN/ES** — actualmente monolingue. Extrair strings de `site-content.ts` + páginas para `i18n.ts` com `useTranslation()`.
24. 💡 **Validação Zod dos dados do localStorage** — antes de renderizar, parse `oficina_site_content` com `z.object(SiteContentSchema)`; se falhar, fallback para `DEFAULT_CONTENT` em vez de crash.

---

## 13. Manutenção deste README

Este README é a **única fonte de verdade** (Single Source of Truth). É atualizado em **cada turno de alteração relevante** da conversa. Matriz de manutenção:

| Mudança | Secção a atualizar |
|---|---|
| Adicionar/remover dependência | § 2 Stack Técnica |
| Criar nova pasta ou ficheiro | § 3 Estrutura de Pastas |
| Mudar tokens CSS / cores / animações | § 5 Design System |
| Mudar hierarquia de roles / auth | § 4 Arquitetura |
| Adicionar nova rota / âncora | § 6 Rotas e Âncoras |
| Adicionar/remover funcionalidade | § 7 Funcionalidades Chave |
| Mudar estratégia mobile | § 8 Otimização Mobile/Tablet |
| Mudar convenção de código | § 9 Convenções de Código |
| Adicionar/atualizar script | § 10 Scripts NPM |
| Adicionar nota de ambiente | § 11 Notas WebContainer |
| Adicionar improvements | § 12 O que ainda podemos melhorar |

**Regra prática**: se uma mudança ao código levaria outra pessoa (humana ou IA) a fazer suposições erradas sobre o estado do projeto, documenta-a aqui. Se a melhoria listada em § 12 for implementada, movê-la para a secção correspondente e remover de § 12.

### Última atualização

**2026-07-20** —
- Renomeado de "Binário Poético" para projeto demo "A Sua Oficina" + NV76 HUB logo (badge redondo).
- localStorage keys renomeadas de `binario_*` → `oficina_*`.
- Telefone alterado para `928 029 314`; mensagem WhatsApp pré-definida `olá pedro quanto custa o site?`.
- `DesignSettings.tsx` eliminado (código morto); `DevEditableImage` mantido como renderer read-only.
- Coerção defensiva em `resolveLinks` e `Footer.tsx` para prevenir crashes com dados localStorage corruptos.
- Hero/CtaStrip parallax isolados em sub-componentes — zero hooks de scroll em mobile.
- Hook `useDeviceMotion` adicionado (§ 8) — base da otimização mobile/tablet.
- 11 SVGs placeholder criados em `public/images/` (1 logo + 4 principais + 8 galeria).
- Adicionada § 12 com 24 melhorias priorizadas.
