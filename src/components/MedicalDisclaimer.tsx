import { AlertTriangle } from "lucide-react";

export const MedicalDisclaimer = ({ className = "" }: { className?: string }) => (
  <div className={`flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground/80 ${className}`}>
    <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
    <p>AI output is for assistance only and does not replace professional medical advice. Always consult a qualified doctor.</p>
  </div>
);
