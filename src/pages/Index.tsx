import { Button } from "@/components/ui/button";
import EmeraldOrb from "@/components/EmeraldOrb";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <EmeraldOrb />
      <section className="container relative z-10 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Emerald Orb Animation — Morph-style Effect
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A deep-emerald, soft-glow orb inspired by morph.org, integrated into this
            React + Tailwind app.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button variant="hero" className="group">
              Get Started
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button variant="outline">Learn more</Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
