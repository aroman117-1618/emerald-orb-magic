import React from "react";
import { Info, Headphones, TrendingUp } from "lucide-react";

type Props = {
  variant: "about" | "services" | "impact";
  className?: string;
};

const SectionGlyph: React.FC<Props> = ({ variant, className }) => {
  const Icon = variant === "about" ? Info : variant === "services" ? Headphones : TrendingUp;
  return <Icon className={className} aria-hidden />;
};

export default SectionGlyph;
