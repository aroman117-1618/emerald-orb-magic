import * as React from "react";

import { cn } from "@/lib/utils";

export type Testimonial = {
  author: string;
  role: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    author: "Rahat Rahman",
    role: "Senior Strategy Manager",
    quote:
      "Andrew brought clarity and structure to complex change management. His collaboration on BoB processes, dashboards, and team strategy made a lasting impact.",
  },
  {
    author: "Natalia Wyatt",
    role: "Billing Operations Manager",
    quote:
      "Andrew bridges customer needs with operational best practices, streamlining billing processes and boosting productivity across teams.",
  },
  {
    author: "Allie Guertin",
    role: "Sr. Manager of Customer Success",
    quote:
      "Andrew’s analytical mindset and advanced reporting drive results. He has the potential to influence leaders as much as CSMs.",
  },
  {
    author: "Junya Kato",
    role: "Collections Manager",
    quote:
      "Proactive, resourceful, and committed to improvement — Andrew reduces unnecessary work and empowers teams.",
  },
  {
    author: "Rob Allen Jr",
    role: "Principal CSM",
    quote:
      "Andrew’s mentorship and leadership foster growth, confidence, and lasting career impact.",
  },
  {
    author: "Jina Algarin",
    role: "Director of Business Operations",
    quote:
      "Andrew blends technical expertise with customer care — a cultural and operational asset to any team.",
  },
  {
    author: "Omkar Waghe",
    role: "Customer Success Engineer",
    quote:
      "Andrew built a high-trust, high-performing team, refined processes, and became a trusted SME well beyond his role.",
  },
];

interface Props {
  className?: string;
}

const TestimonialsCarousel: React.FC<Props> = ({ className }) => {
  // Duplicate testimonials for seamless loop
  const items = React.useMemo(() => [...TESTIMONIALS, ...TESTIMONIALS], []);

  return (
    <section aria-label="Testimonials carousel" className={cn("relative", className)}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="group relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="flex gap-6 will-change-transform animate-[marquee_12.5s_linear_infinite] group-hover:[animation-play-state:paused]">
          {items.map((t, i) => (
            <article key={i} className="shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 py-6">
              <div className="h-full rounded-xl border bg-card/40 backdrop-blur transition-colors duration-300 hover:bg-primary hover:text-primary-foreground">
                <div className="p-6 md:p-8">
                  <p className="text-base md:text-lg leading-relaxed">“{t.quote}”</p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">{t.author}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground hover:text-primary-foreground/80">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
