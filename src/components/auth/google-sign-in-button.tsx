import Image from "next/image";
import { signInWithGoogleAction } from "@/lib/actions/auth";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <form action={signInWithGoogleAction}>
      <PendingSubmitButton variant="secondary" className="w-full bg-background text-foreground ring-1 ring-border hover:bg-muted" pendingLabel="Connecting...">
        <Image src="/images/google.svg" alt="" width={20} height={20} aria-hidden />
        {label}
      </PendingSubmitButton>
    </form>
  );
}
