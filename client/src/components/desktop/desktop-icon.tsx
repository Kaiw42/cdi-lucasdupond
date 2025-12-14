import { LucideIcon } from "lucide-react";

interface DesktopIconProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  testId: string;
}

export function DesktopIcon({ icon: Icon, label, onClick, testId }: DesktopIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-md hover-elevate active-elevate-2 w-20 text-center group"
      data-testid={testId}
    >
      <div className="w-12 h-12 rounded-lg bg-card border border-card-border flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="text-xs font-medium truncate w-full px-1">{label}</span>
    </button>
  );
}
