import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Services } from "@/components/landing/Services";
import { Features } from "@/components/landing/Features";
import { Stats } from "@/components/landing/Stats";
import { Gallery } from "@/components/landing/Gallery";
import { Reviews } from "@/components/landing/Reviews";
import { FAQSection } from "@/components/landing/FAQ";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { BackToTop } from "@/components/landing/BackToTop";
import { DevToolbar } from "@/components/dev/DevToolbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <DevToolbar />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Features />
        <Stats />
        <Gallery />
        <Reviews />
        <FAQSection />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
