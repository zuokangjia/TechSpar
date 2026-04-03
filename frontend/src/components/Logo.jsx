import { cn } from "@/lib/utils";

export default function Logo({ className }) {
  return (
    <img
      src="/logo-mark.png"
      alt="TechSpar"
      className={cn("shrink-0 block object-contain", className)}
    />
  );
}
