import * as React from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
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
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [paused, setPaused] = React.useState(false);

  // Auto-advance every 7s, pause on hover/focus
  React.useEffect(() => {
    if (!api) return;
    let id: number | undefined;
    const play = () => {
      id = window.setInterval(() => {
        if (!paused) api.scrollNext();
      }, 7000);
    };
    play();

    const onMouseEnter = () => setPaused(true);
    const onMouseLeave = () => setPaused(false);
    const root = api.rootNode();
    root.addEventListener("mouseenter", onMouseEnter);
    root.addEventListener("mouseleave", onMouseLeave);

    return () => {
      if (id) window.clearInterval(id);
      root.removeEventListener("mouseenter", onMouseEnter);
      root.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [api, paused]);

  return (
    <section
      aria-label="Testimonials carousel"
      className={cn("relative", className)}
    >
      {/* Full-bleed wrapper so slides enter/exit at viewport edges */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <Carousel
          opts={{ loop: true, align: "start", skipSnaps: false }}
          setApi={setApi}
          className="relative"
        >
          {/* Remove default gutters for true edge-to-edge */}
          <CarouselContent className="ml-0">
            {TESTIMONIALS.map((t, i) => (
              <CarouselItem key={i} className="pl-0">
                <article className="group flex items-center justify-center py-10 md:py-16">
                  {/* Inner container for readable width */}
                  <div
                    className={cn(
                      "mx-4 md:mx-8 w-full max-w-4xl rounded-xl border transition-colors duration-300",
                      "bg-background/40 backdrop-blur",
                      "group-hover:bg-primary group-hover:text-primary-foreground"
                    )}
                  >
                    <div className="p-6 md:p-10">
                      <p className="text-base md:text-lg leading-relaxed">
                        “{t.quote}”
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">{t.author}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground group-hover:text-primary-foreground/80">
                            {t.role}
                          </p>
                        </div>
                        <span className="text-xs tracking-wider text-muted-foreground/70 group-hover:text-primary-foreground/70">
                          TESTIMONIAL
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
