import type { ReactNode } from "react";
import { ActionButton } from "@/components/ui/action-button";

type AdminActionButtonProps = {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
};

export function AdminActionButton({ action, hiddenFields, children, variant = "secondary", pendingLabel = "Working..." }: AdminActionButtonProps) {
  return (
    <ActionButton action={action} fields={hiddenFields} variant={variant} pendingLabel={pendingLabel}>
      {children}
    </ActionButton>
  );
}
