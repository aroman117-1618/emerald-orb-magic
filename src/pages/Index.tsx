import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmeraldOrb from "@/components/EmeraldOrb";
import SectionGlyph from "@/components/SectionGlyph";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <a id="top" className="sr-only" aria-hidden tabIndex={-1} />
      <EmeraldOrb />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <nav className="container flex h-14 items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <img
              src="/lovable-uploads/0beb7de9-fb53-4a31-baec-e3c83857afee.png"
              alt="Andrew in Motion logo"
              width={20}
              height={20}
              className="h-5 w-5 rounded-sm"
              loading="eager"
              decoding="async"
            />
            <span>Andrew Lonati</span>
          </a>
          <div className="hidden gap-6 md:flex">
            <a href="#about" className="story-link text-sm text-muted-foreground">About</a>
            <a href="#services" className="story-link text-sm text-muted-foreground">Services</a>
            <a href="#impact" className="story-link text-sm text-muted-foreground">Impact</a>
            <a href="#testimonials" className="story-link text-sm text-muted-foreground">Testimonials</a>
            <a href="#contact" className="story-link text-sm text-muted-foreground">Contact</a>
          </div>
          <Button asChild size="sm" variant="secondary">
            <a href="#contact">Get in touch</a>
          </Button>
        </nav>
      </header>

      <section className="container relative z-10 py-20 md:py-28 text-center" aria-labelledby="hero-title">
        <p className="text-xs tracking-[0.2em] text-muted-foreground">CS ADVISORY • GTM AUTOMATION • LIFECYCLE SYSTEMS</p>
        <h1 id="hero-title" className="mt-3 text-5xl md:text-6xl font-bold tracking-tight">
          Scale your growth <span className="text-primary">without scaling headcount</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
          Partnering with leaders to remove bottlenecks, create customer-centric systems, and turn signals into sustainable growth.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild variant="hero" className="group">
            <a href="#services">Explore Services <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></a>
          </Button>
          <Button asChild variant="outline">
            <a href="#about">Learn More</a>
          </Button>
        </div>
      </section>

      <main className="relative z-10">
        {/* About */}
        <section id="about" className="container relative py-20 md:py-28" aria-labelledby="about-title">
          <div aria-hidden className="pointer-events-none absolute -left-6 -top-10 text-primary/25">
            <SectionGlyph variant="about" className="h-40 w-40" />
          </div>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">ABOUT</p>
            <h2 id="about-title" className="mt-2 text-3xl md:text-4xl font-semibold">Collaboration, precision, and adaptability</h2>
            <p className="mt-3 text-muted-foreground">
              From the kitchen to the boardroom: service instincts + data-driven rigor to design systems that move revenue.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Operator Origin</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                I started in fine dining, where survival meant collaboration, precision, and adaptability. Those values shaped my
                approach in tech — first in value-based discovery and negotiation, then in building systems that surface real
                customer signals and scale insights across teams.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Turning customer data into proactive growth strategies</li>
                <li>• Building systems that turn customer signals into scalable action</li>
                <li>• Translating insights into measurable revenue impact</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Track Record</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Led the full customer lifecycle — pre-sale through renewal — with a focus on scalable automation and cross-functional
                alignment.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Nift — Early-stage growth & foundational GTM build-out.</li>
                <li>• Robin — Series A/B scaling, automation design, retention systems.</li>
                <li>• Datadog — At-scale & FedGov GTM lifecycle automation.</li>
                <li>• Klaviyo — RevOps automations; contract-to-cash; ROI reporting.</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="container relative py-20 md:py-28" aria-labelledby="services-title">
          <div aria-hidden className="pointer-events-none absolute -left-6 -top-10 text-primary/20">
            <SectionGlyph variant="services" className="h-40 w-40" />
          </div>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">SERVICES</p>
            <h2 id="services-title" className="mt-2 text-3xl md:text-4xl font-semibold">Two ways to engage, endless ways to deliver.</h2>
            <p className="mt-3 text-muted-foreground">Simple hourly pricing + tailored scopes to fit your growth stage.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold">CS Advisor Retainer</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Strategic planning & execution support.</li>
                <li>• Team coaching & playbook development.</li>
                <li>• Renewal, expansion, and churn mitigation programs.</li>
              </ul>
              <div className="mt-5 glass-panel">
                <p className="text-xs tracking-wider text-muted-foreground">EXPECTED RESULTS</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>• Integrated CX Leadership support</li>
                  <li>• Value-based, higher-performing CS teams.</li>
                  <li>• Guidance for scalable lifecycle operations.</li>
                </ul>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold">GTM System Automation / Architecture</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end GTM workflow mapping.</li>
                <li>• AI & automation: CRM, CS platforms, comms.</li>
                <li>• Cross-system integrations for data integrity & reporting.</li>
              </ul>
              <div className="mt-5 glass-panel">
                <p className="text-xs tracking-wider text-muted-foreground">EXPECTED RESULTS</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>• 10–20 hours saved per GTM rep per week.</li>
                  <li>• SLA compliance + customer satisfaction gains.</li>
                  <li>• Real-time data for faster decision-making.</li>
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Impact */}
        <section id="impact" className="container relative py-20 md:py-28" aria-labelledby="impact-title">
          <div aria-hidden className="pointer-events-none absolute -left-6 -top-10 text-primary/20">
            <SectionGlyph variant="impact" className="h-40 w-40" />
          </div>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">IMPACT</p>
            <h2 id="impact-title" className="mt-2 text-3xl md:text-4xl font-semibold">Proof in performance.</h2>
            <p className="mt-3 text-muted-foreground">Selected outcomes from past projects.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold">GTM Lifecycle Automation</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• +34% NRR, +18-point NPS from lifecycle segmentation & adoption campaigns.</li>
                <li>• +45 add-ons/quarter via sentiment→action pipelines.</li>
                <li>• 42% churn reduction, $2M ARR retention impact from integrated feedback loops.</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold">RevOps & CS Automations</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• 200+ weekly hours saved via contract-to-cash automations.</li>
                <li>• 8x increase in committed customers; +18% NRR (+$1.62M ARR).</li>
              </ul>
              <div className="mt-5 glass-panel">
                <h4 className="text-sm font-medium">Occupancy-Based & Personal Automations</h4>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>• Enterprise-scale secure RFID access integrations.</li>
                  <li>• Hands-free daily briefing sequence via IoT & automation server.</li>
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="container py-20 md:py-28" aria-labelledby="testimonials-title">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">TESTIMONIALS</p>
            <h2 id="testimonials-title" className="mt-2 text-3xl md:text-4xl font-semibold">Trusted by operators and partners</h2>
            <p className="mt-3 text-muted-foreground">
              Condensed notes from people I’ve worked with—focused on outcomes, clarity, and how teams felt supported.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Andrew brought clarity to complex change management—owning handoffs, dashboards, and process templates that simplified the work and raised the bar.",
              "He bridges customer needs with operational rigor. The billing workflow improvements boosted productivity across teams.",
              "Analytical and impact-driven. Andrew’s reporting and approach influence not just CSMs—leaders learn from him too.",
            ].map((quote, i) => (
              <Card key={i} className="p-6">
                <p className="text-sm text-muted-foreground">“{quote}”</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="container py-16 md:py-20" aria-labelledby="contact-title">
          <Card className="mx-auto max-w-4xl p-8 md:p-10">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">CONTACT</p>
            <h2 id="contact-title" className="mt-2 text-2xl md:text-3xl font-semibold">
              Ready to remove bottlenecks and surface real signal?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Book a short intro call. We’ll pinpoint 1–2 high-leverage automations or CS plays you can deploy within 30–45 days.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button asChild variant="secondary">
                <a href="mailto:Andrew.roman117@gmail.com">Email Me</a>
              </Button>
              <Button asChild variant="hero" className="group">
                <a href="https://calendar.app.google/ovfeAVX2EFt9RCUL6" target="_blank" rel="noreferrer">
                  Book a Call <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © 2025 Andrew Lonati. All rights reserved.
      </footer>
    </main>
  );
};

export default Index;
