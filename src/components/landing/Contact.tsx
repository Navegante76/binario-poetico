import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FadeUp } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import {
  resolveLinks,
  buildEmailHref,
  buildMapSearchHref,
} from "@/lib/links";
import { useSubmitForm, isTurnstileEnabled } from "@/lib/form-submissions";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Indique o seu nome (mín. 2 caracteres).").max(80),
  telefone: z.string().trim().min(9, "Indique um telefone válido.").max(20).regex(/^[\d\s+()-]+$/, "Use apenas números e espaços."),
  email: z.string().trim().email("Email inválido.").max(120),
  marca: z.string().trim().min(2, "Indique a marca do veículo.").max(60),
  modelo: z.string().trim().min(1, "Indique o modelo.").max(60),
  mensagem: z.string().trim().min(10, "Descreva brevemente o serviço pretendido.").max(2000),
});

type FormValues = z.infer<typeof formSchema>;

/** Source = current page path; used on the dashboard row to track referrals. */
function currentSource(): string | undefined {
  return typeof window !== "undefined" ? window.location.pathname : undefined;
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { content } = useContent();
  const submitAction = useSubmitForm();

  const c = content.contact;
  const L = resolveLinks(content.links);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as
    | string
    | undefined;
  const turnstileConfigured = isTurnstileEnabled() && !!siteKey;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      marca: "",
      modelo: "",
      mensagem: "",
    },
  });

  const CONTACT_ITEMS = [
    { icon: MapPin, label: "Morada", value: c.address, href: L.mapSearchHref },
    { icon: Phone, label: "Telefone", value: c.phone, href: L.phoneHref },
    { icon: Mail, label: "Email", value: c.email, href: buildEmailHref(content.links.email) },
  ] as const;

  const onSubmit = async (values: FormValues) => {
    // Persist the lead to Convex via the verified action. The owner's
    // email notification (Resend / webhook / etc.) is wired elsewhere;
    // intentionally we DO NOT pop a mailto on the visitor's email client.
    try {
      await submitAction({
        name: values.nome,
        phone: values.telefone,
        email: values.email,
        marca: values.marca,
        modelo: values.modelo,
        mensagem: values.mensagem,
        source: currentSource(),
        turnstileToken: turnstileToken ?? "",
      });

      toast.success("Pedido enviado com sucesso!", {
        description:
          "Recebemos o seu pedido e vamos responder em breve por email ou telefone.",
      });
      setSent(true);
      form.reset();
      setTurnstileToken(null);
    } catch (err) {
      console.error("[Contact] submitAction failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Tente novamente ou contacte-nos por telefone / email.";
      toast.error("Não foi possível enviar o pedido.", {
        description: message,
      });
    }
  };

  return (
    <section id="contactos" className="relative bg-background py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-[#DC2626]/5 blur-3xl" />

      <div id="orcamento" className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626]">
              <DevEditable path="contact.badge" value={c.badge} />
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <DevEditable path="contact.title1" value={c.title1} />
              <span className="text-[#DC2626]">
                <DevEditable path="contact.titleHighlight" value={c.titleHighlight} />
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <DevEditable path="contact.description" value={c.description} />
            </p>
          </FadeUp>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-5 lg:gap-10">
          <FadeUp delay={0.05} className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">
                <DevEditable path="contact.orgName" value={c.orgName} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <DevEditable path="contact.orgSub" value={c.orgSub} />
              </p>

              <div className="mt-7 space-y-5">
                {CONTACT_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-secondary"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] text-white transition-colors group-hover:bg-[#DC2626]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-base font-medium text-foreground">{item.value}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#DC2626]" aria-hidden />
                  </a>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3.5">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} aria-hidden className="text-amber-400">★</span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    <DevEditable path="contact.googleRating" value={c.googleRating} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <DevEditable path="contact.googleReviews" value={c.googleReviews} />
                  </p>
                </div>
              </div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-border/60">
                <div className="aspect-[4/3] w-full bg-secondary">
                  <iframe
                    title="Mapa — Binário Poético"
                    src={L.mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-secondary px-3 py-1 font-medium text-foreground">
                  <DevEditable path="contact.hoursWeekday" value={c.hoursWeekday} />
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 font-medium text-foreground">
                  <DevEditable path="contact.hoursSaturday" value={c.hoursSaturday} />
                </span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.15} className="lg:col-span-3">
            <motion.div
              animate={sent ? { scale: [1, 1.01, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm sm:p-9"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    <DevEditable path="contact.formTitle" value={c.formTitle} />
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <DevEditable path="contact.formSub" value={c.formSub} />
                  </p>
                </div>
                <span className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#DC2626] text-white sm:inline-flex">
                  <MessageSquare className="h-6 w-6" />
                </span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="nome" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="O seu nome" className="h-12 rounded-xl pl-10" autoComplete="name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="telefone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="tel" placeholder="912 345 678" className="h-12 rounded-xl pl-10" autoComplete="tel" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="email" placeholder="email@exemplo.pt" className="h-12 rounded-xl pl-10" autoComplete="email" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="marca" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca do veículo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Ex: BMW, Renault..." className="h-12 rounded-xl pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="modelo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Série 1, Clio..." className="h-12 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="mensagem" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o serviço pretendido ou a avaria do seu veículo." className="min-h-[140px] rounded-xl resize-y" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Cloudflare Turnstile — only renders when a public site key is configured. */}
                  {turnstileConfigured && siteKey && (
                    <div className="flex flex-col items-end gap-1.5 pt-1">
                      <Turnstile
                        siteKey={siteKey}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                        options={{
                          theme: "auto",
                          language: "pt",
                          size: "flexible",
                        }}
                      />
                      <p className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <ShieldCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
                        Validado por Cloudflare Turnstile (gratuito, sem cookies de tracking).
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col-reverse items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      <DevEditable path="contact.privacyText" value={c.privacyText} />
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={
                        form.formState.isSubmitting ||
                        (turnstileConfigured && !turnstileToken)
                      }
                      className="group h-12 rounded-full bg-[#DC2626] px-7 text-base font-semibold shadow-lg shadow-red-900/30 hover:bg-[#ef4444]"
                    >
                      {form.formState.isSubmitting ? "A enviar..." : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          <DevEditable path="contact.submitButton" value={c.submitButton} />
                          <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
