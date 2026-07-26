"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionButtonProps = {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  "aria-label"?: string;
};

export function ActionButton({
  action,
  fields,
  children,
  pendingLabel = "Working...",
  variant,
  className,
  "aria-label": ariaLabel
}: ActionButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function runAction() {
    setPending(true);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value));

    try {
      await action(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={className} disabled={pending} aria-label={ariaLabel} onClick={runAction}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
