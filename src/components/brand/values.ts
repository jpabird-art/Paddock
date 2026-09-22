import { BarChart3, Heart, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BrandValue {
  label: string;
  detail: string;
  icon: LucideIcon;
}

/** The four commitments from the Paddock brand mark. */
export const brandValues: BrandValue[] = [
  {
    label: "Horse first",
    detail: "Welfare is the organising principle, not a report you run at the end of the month.",
    icon: Heart,
  },
  {
    label: "Built for efficiency",
    detail: "One record, entered once, read by everyone who needs it.",
    icon: BarChart3,
  },
  {
    label: "Trusted & secure",
    detail: "Your own instance, your own database, every change logged.",
    icon: ShieldCheck,
  },
  {
    label: "Made for yards",
    detail: "Designed around how a working yard actually runs its day.",
    icon: Users,
  },
];
