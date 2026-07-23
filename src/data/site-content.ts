/**
 * Central content store — DEMO / FICTIONAL DATA.
 * All text + URLs displayed on the site are defined here.
 * Edit in developer mode → persisted to localStorage + JSON file.
 */

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface ReviewItem {
  name: string;
  text: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  active: boolean;
}

export interface SiteContent {
  hero: {
    tagline: string;
    titlePart1: string;
    titlePart2: string;
    subtitle: string;
    description: string;
    ratingValue: string;
    ratingTotal: string;
    ratingLabel: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustBadge1: string;
    trustBadge2: string;
    trustBadge3: string;
  };
  navbar: {
    brandName: string;
    brandSub: string;
    items: string[];
    ctaButton: string;
  };
  about: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    highlights: { title: string; text: string; icon: string }[];
    badgeLabel: string;
    badgeSub: string;
  };
  services: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    items: ServiceItem[];
  };
  features: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    items: FeatureItem[];
  };
  stats: {
    badge: string;
    title: string;
    items: { suffix: string; label: string; icon: string }[];
  };
  gallery: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
  };
  reviews: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    ratingSummary: string;
    ratingCount: string;
    items: ReviewItem[];
    ctaGoogle: string;
  };
  faq: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    items: FaqItem[];
  };
  contact: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    orgName: string;
    orgSub: string;
    address: string;
    phone: string;
    email: string;
    googleRating: string;
    googleReviews: string;
    hoursWeekday: string;
    hoursSaturday: string;
    formTitle: string;
    formSub: string;
    privacyText: string;
    submitButton: string;
  };
  footer: {
    brandName: string;
    brandSub: string;
    description: string;
    rating: string;
    ratingCount: string;
    servicesTitle: string;
    services: string[];
    navTitle: string;
    contactsTitle: string;
    address: string;
    phone: string;
    email: string;
    copyright: string;
    privacyLink: string;
    termsLink: string;
  };
  ctaStrip: {
    question: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  animatedCarPath: {
    badge: string;
    title1: string;
    titleHighlight: string;
    description: string;
    steps: { label: string; service: string }[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  assets: {
    heroBg: string;
    aboutMain: string;
    aboutSmall: string;
    ctaBg: string;
    gallery: { src: string; alt: string; category: string }[];
    logoInitials: string;
    mapCoords: string;
  };
  links: {
    phoneDisplay: string;
    phoneRaw: string;
    whatsappRaw: string;
    whatsappMessage: string;
    email: string;
    mapCoords: string;
    orcamentoAnchor: string;
    navAnchors: string[];
    socials: SocialLink[];
  };
}

/* ================================================================== */
/*  DEFAULT CONTENT — 100% fictional / demo data                     */
/*  Photos: 100% workshop/mechanic (no people running, no 404s)       */
/*  All URLs verified 200 OK via HEAD-fetch on 2026-07-20            */
/* ================================================================== */

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    tagline: "Oficina Auto · Demo",
    titlePart1: "A Sua",
    titlePart2: "Oficina",
    subtitle: "Oficina Automóvel Multimarcas",
    description:
      "Especialistas em mecânica, manutenção, diagnóstico eletrónico, chaparia e pintura. Cuidamos do seu automóvel com profissionalismo e dedicação.",
    ratingValue: "4.7",
    ratingTotal: "128",
    ratingLabel: "avaliações",
    ctaPrimary: "Pedir Orçamento",
    ctaSecondary: "Ligar Agora",
    trustBadge1: "Diagnóstico Certificado",
    trustBadge2: "Acabamento Impecável",
    trustBadge3: "Multimarcas",
  },
  navbar: {
    brandName: "A Sua Oficina",
    brandSub: "Oficina Auto",
    items: ["Início", "Serviços", "Sobre Nós", "Galeria", "Contactos"],
    ctaButton: "Pedir Orçamento",
  },
  about: {
    badge: "Sobre Nós",
    title1: "A sua oficina de ",
    titleHighlight: "confiança",
    description:
      "A Sua Oficina presta serviços de reparação e manutenção automóvel para todas as marcas. Apostamos num atendimento personalizado, diagnósticos rigorosos, equipamentos modernos e soluções eficientes para garantir a segurança e o desempenho do seu veículo.",
    highlights: [
      { title: "Experiência comprovada", text: "Anos de experiência ao serviço do seu veículo.", icon: "Award" },
      { title: "Diagnóstico rigoroso", text: "Equipamentos eletrónicos de diagnóstico multimarca.", icon: "CheckCircle2" },
      { title: "Soluções eficientes", text: "Reparação rápida com peças de qualidade original.", icon: "Wrench" },
      { title: "Compromisso com prazos", text: "Entregas dentro do prazo acordado, sem surpresas.", icon: "Clock" },
    ],
    badgeLabel: "Multimarcas",
    badgeSub: "Todas as marcas",
  },
  services: {
    badge: "Serviços",
    title1: "Soluções completas para o seu ",
    titleHighlight: "automóvel",
    description:
      "Da manutenção de rotina à reparação complexa, oferecemos um serviço de oficina completo com tecnologia e profissionalismo.",
    items: [
      { title: "Mecânica Geral", description: "Reparação completa e manutenção preventiva para todos os sistemas do veículo.", icon: "Wrench" },
      { title: "Diagnóstico Eletrónico", description: "Leitura de erros avançada, codificação e verificação completa de sistemas.", icon: "Gauge" },
      { title: "Revisões", description: "Revisões periódicas de acordo com o construtor e plano de manutenção.", icon: "Car" },
      { title: "Mudança de Óleo e Filtros", description: "Troca de óleo motor e filtros com produtos de qualidade superior.", icon: "Droplets" },
      { title: "Travões", description: "Substituição de pastilhas, discos, maxilas e inspeção do sistema de travagem.", icon: "Disc3" },
      { title: "Suspensão", description: "Reparação e substituição de amortecedores, molas e componentes de suspensão.", icon: "Sparkles" },
      { title: "Direção", description: "Alinhamento, direção assistida e cremalheira com diagnóstico preciso.", icon: "ThermometerSun" },
      { title: "Embraiagens", description: "Substituição de embraiagem, volante bimassa ou kit completo.", icon: "Wrench" },
      { title: "Distribuição", description: "Substituição da correia de distribuição e componentes associados.", icon: "Sparkles" },
      { title: "Ar Condicionado", description: "Recarga de gás, verificação de fugas e higienização do sistema.", icon: "Snowflake" },
      { title: "Baterias", description: "Teste, substituição e diagnóstico do sistema elétrico de arranque.", icon: "Battery" },
      { title: "Chaparia", description: "Reparação de carroçaria após colisão, desabollamento e substituição de peças.", icon: "Car" },
      { title: "Pintura", description: "Pintura completa ou parcial em cabine fechada, acabamento de excelência.", icon: "PaintBucket" },
    ],
  },
  features: {
    badge: "Diferenciais",
    title1: "Porque escolher a ",
    titleHighlight: "Sua Oficina",
    description:
      "Compromisso, transparência e qualidade em cada visita à nossa oficina. Veja o que nos distingue.",
    items: [
      { title: "Oficina Multimarcas", description: "Serviço profissional para todas as marcas e modelos.", icon: "BadgeCheck" },
      { title: "Técnicos Experientes", description: "Equipa qualificada com anos de experiência.", icon: "Wrench" },
      { title: "Equipamentos Modernos", description: "Tecnologia de ponta em diagnóstico e reparação.", icon: "Sparkles" },
      { title: "Orçamentos Transparentes", description: "Clareza total nos preços, sem surpresas.", icon: "Handshake" },
      { title: "Atendimento Personalizado", description: "Cada cliente recebe acompanhamento dedicado.", icon: "UserCheck" },
      { title: "Qualidade e Profissionalismo", description: "Padrões elevados em todos os serviços executados.", icon: "Award" },
      { title: "Cumprimento de Prazos", description: "Entregas dentro do prazo acordado.", icon: "CalendarCheck" },
      { title: "Serviço de Confiança", description: "Recomendados pelos nossos clientes.", icon: "ShieldCheck" },
    ],
  },
  stats: {
    badge: "Confiança que se mede",
    title: "Números que refletem o nosso trabalho",
    items: [
      { suffix: "+", label: "Avaliações Google", icon: "Star" },
      { suffix: "★", label: "Classificação Média", icon: "Award" },
      { suffix: "%", label: "Dedicação", icon: "Target" },
      { suffix: "", label: "Multimarcas", icon: "Wrench" },
    ],
  },
  gallery: {
    badge: "Galeria",
    title1: "Conheça a nossa ",
    titleHighlight: "oficina",
    description:
      "Ambiente profissional, equipamentos modernos e uma equipa dedicada ao seu veículo — do diagnóstico à entrega, do motor à pintura.",
  },
  reviews: {
    badge: "Testemunhos",
    title1: "O que dizem os nossos ",
    titleHighlight: "clientes",
    description:
      "A confiança dos nossos clientes é o melhor indicador da qualidade do nosso trabalho.",
    ratingSummary: "4.7 / 5",
    ratingCount: "Baseado em 128 avaliações Google",
    items: [
      { name: "Carlos Silva", text: "Empresa de confiança. Ótimo atendimento e serviço impecável." },
      { name: "Mariana Costa", text: "Oficina de confiança. Recomendo vivamente a experiência e profissionalismo." },
      { name: "Rui Almeida", text: "Excelente atendimento. Equipa simpática e competente, trabalho de qualidade." },
      { name: "Ana Pereira", text: "Diagnóstico rápido e solução eficiente. Recomendo a todos." },
      { name: "Tiago Marques", text: "Pintura impecável, o carro ficou como novo. Profissionalismo de elite." },
      { name: "Sofia Rocha", text: "Atenção aos detalhes e orçamentos claros. Voltarei certamente." },
    ],
    ctaGoogle: "Ver todas as avaliações no Google",
  },
  faq: {
    badge: "Perguntas Frequentes",
    title1: "Tudo o que precisa de ",
    titleHighlight: "saber",
    description:
      "Respostas claras às dúvidas mais comuns. Não encontra a sua pergunta? Contacte-nos directamente.",
    items: [
      { q: "Que marcas reparam?", a: "Reparamos todas as marcas e modelos de veículos — desde carros citadinos a utilitários e SUV. Somos uma oficina verdadeiramente multimarcas." },
      { q: "É possível pedir orçamento?", a: "Sim. Pode pedir um orçamento sem compromisso através do formulário no site, por telefone ou por WhatsApp. Respondemos com a maior brevidade possível." },
      { q: "Quanto demora uma revisão?", a: "Uma revisão periódica standard demora, em média, entre 2 a 4 horas, dependendo do modelo e dos serviços incluídos. Comunicamos sempre o tempo estimado." },
      { q: "Fazem chaparia e pintura?", a: "Sim. Dispomos de serviço completo de chaparia e pintura em cabine fechada, com acabamento profissional e combinação de cores digital." },
      { q: "Têm diagnóstico eletrónico?", a: "Sim. Utilizamos equipamentos de diagnóstico eletrónico modernos, compatíveis com a maioria das marcas, para identificar avarias com precisão." },
    ],
  },
  contact: {
    badge: "Contactos",
    title1: "Peça o seu ",
    titleHighlight: "orçamento",
    description:
      "Preencha o formulário ou contacte-nos directamente. Responderemos com a maior brevidade possível.",
    orgName: "A Sua Oficina",
    orgSub: "Oficina Automóvel Multimarcas",
    address: "Rua da Oficina, 123 · 4000-000 Porto",
    phone: "928029314",
    email: "navegante76pv@gmail.com",
    googleRating: "Google 4.7 / 5",
    googleReviews: "128 avaliações verificadas",
    hoursWeekday: "Segunda a Sexta · 09:00 – 19:00",
    hoursSaturday: "Sábado · 09:00 – 13:00",
    formTitle: "Formulário de Contacto",
    formSub: "Envie-nos os detalhes do seu veículo e descreva o serviço pretendido.",
    privacyText: "Ao enviar este formulário concorda com a nossa política de privacidade.",
    submitButton: "Pedir Orçamento",
  },
  footer: {
    brandName: "A Sua Oficina",
    brandSub: "Oficina Auto",
    description:
      "Oficina automóvel multimarcas. Especialistas em mecânica, revisões, diagnóstico, chaparia e pintura. Atendimento profissional, transparente e dedicado.",
    rating: "4.7 / 5 no Google",
    ratingCount: "128 avaliações",
    servicesTitle: "Serviços",
    services: ["Mecânica Geral", "Diagnóstico Eletrónico", "Revisões", "Chaparia", "Pintura"],
    navTitle: "Navegação",
    contactsTitle: "Contactos Rápidos",
    address: "Rua da Oficina, 123 · 4000-000 Porto",
    phone: "928029314",
    email: "navegante76pv@gmail.com",
    copyright: "A Sua Oficina · Todos os direitos reservados.",
    privacyLink: "Política de Privacidade",
    termsLink: "Termos",
  },
  ctaStrip: {
    question: "Precisa de reparar o seu veículo? Fale connosco hoje.",
    ctaPrimary: "Pedir Orçamento Grátis",
    ctaSecondary: "Ligar: 928029314",
  },
  animatedCarPath: {
    badge: "Processo",
    title1: "Do diagnóstico à ",
    titleHighlight: "entrega",
    description: "Acompanhe o percurso do seu veículo na nossa oficina, com transparência em cada etapa.",
    steps: [
      { label: "01", service: "Receção e Diagnóstico" },
      { label: "02", service: "Orçamento e Aprovação" },
      { label: "03", service: "Reparação / Manutenção" },
      { label: "04", service: "Controlo de Qualidade" },
      { label: "05", service: "Entrega ao Cliente" },
    ],
  },
  seo: {
    title: "A Sua Oficina | Oficina Automóvel Multimarcas",
    description:
      "Oficina automóvel especializada em mecânica, revisões, diagnóstico, chaparia e pintura. Serviço multimarcas com atendimento profissional.",
    keywords:
      "Oficina Auto, Mecânico, Chaparia, Pintura Automóvel, Revisões Automóvel, Diagnóstico Automóvel, Oficina Multimarcas",
  },
  assets: {
    // Hero — workshop interior with dramatic light
    heroBg:
      "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?auto=format&fit=crop&w=1920&q=80",
    // About main — mechanic working on a car
    aboutMain:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80",
    // About small — mechanic hands in repair detail
    aboutSmall:
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=400&q=80",
    // CTA strip — luxury car interior / dramatic
    ctaBg:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
    logoInitials: "SO",
    mapCoords: "41.1579,-8.6291",
    // Gallery — 11 verified-200 workshop photos
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80",
        alt: "Mecânico profissional a reparar um veículo em elevação",
        category: "Mecânica",
      },
      {
        src: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=900&q=80",
        alt: "Mãos de mecânico a trabalhar em motor durante reparação",
        category: "Mecânica",
      },
      {
        src: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80",
        alt: "Técnico automóvel em inspeção detalhada de motor",
        category: "Diagnóstico",
      },
      {
        src: "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&w=900&q=80",
        alt: "Carro em elevação dentro de oficina moderna",
        category: "Oficina",
      },
      {
        src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
        alt: "Carro desportivo em ambiente de oficina profissional",
        category: "Receção",
      },
      {
        src: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=900&q=80",
        alt: "Mecânico a executar serviço de manutenção em carro",
        category: "Revisão",
      },
      {
        src: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80",
        alt: "Lavagem profissional de automóvel em zona dedicada",
        category: "Lavagem",
      },
      {
        src: "https://images.unsplash.com/photo-1483691278019-cb7253bee49f?auto=format&fit=crop&w=900&q=80",
        alt: "Oficina com carro posicionado para intervenção técnica",
        category: "Oficina",
      },
      {
        src: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=900&q=80",
        alt: "Sala de espera da oficina com ambiente profissional",
        category: "Receção",
      },
      {
        src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
        alt: "Interior de carro preparado para serviço de manutenção",
        category: "Diagnóstico",
      },
      {
        src: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?auto=format&fit=crop&w=900&q=80",
        alt: "Vista geral da oficina com carro em elevação hidráulica",
        category: "Oficina",
      },
    ],
  },
  links: {
    phoneDisplay: "928029314",
    phoneRaw: "+351928029314",
    whatsappRaw: "351928029314",
    whatsappMessage:
      "Olá NV76 Hub, quanto custa o site?",
    email: "navegante76pv@gmail.com",
    mapCoords: "41.1579,-8.6291",
    orcamentoAnchor: "#orcamento",
    navAnchors: ["#inicio", "#servicos", "#sobre", "#galeria", "#contactos"],
    socials: [
      { id: "facebook", name: "Facebook", url: "", icon: "facebook", active: true },
      { id: "instagram", name: "Instagram", url: "", icon: "instagram", active: true },
      { id: "linkedin", name: "LinkedIn", url: "", icon: "linkedin", active: true },
      { id: "tiktok", name: "TikTok", url: "", icon: "tiktok", active: true },
    ],
  },
};
