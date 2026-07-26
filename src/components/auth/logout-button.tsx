import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <PendingSubmitButton variant="ghost" pendingLabel="Logging out...">
        <LogOut aria-hidden className="h-4 w-4" />
        Logout
      </PendingSubmitButton>
    </form>
  );
}
