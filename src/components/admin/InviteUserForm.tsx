"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function InviteUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = event.currentTarget;
    try {
      const res = await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await res.json(); setMessage(data.message ?? data.error);
      if (res.ok) form.reset();
      router.refresh();
    } catch { setMessage("Unable to send invitation. Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button>Invite user</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Invite someone to your Paddock</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">They will receive an email to choose their own password.</p>
        <label className="block text-sm">Full name<Input name="name" required maxLength={100} autoComplete="name" /></label>
        <label className="block text-sm">Email<Input name="email" required type="email" autoComplete="email" /></label>
        <label className="block text-sm">Username<Input name="serviceNumber" required pattern="[a-zA-Z0-9_-]{2,32}" title="2–32 letters, numbers, hyphens or underscores" autoComplete="off" /></label>
        <label className="block text-sm">Role<select name="role" defaultValue="TROOPER" className="mt-1 block w-full rounded border p-2">
          <option value="TROOPER">Yard staff</option><option value="OFFICER">Yard manager</option><option value="VET">Vet</option><option value="FARRIER">Farrier</option><option value="ADMIN">Administrator</option>
        </select></label>
        {message && <p role="status" className="text-sm">{message}</p>}
        <Button disabled={busy} type="submit">{busy ? "Sending…" : "Send invitation"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
export function SendPasswordLink({ userId }: { userId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <div><Button size="sm" variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setMessage("");
    try { const res = await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json(); setMessage(res.ok ? "Email sent" : data.error);
    } catch { setMessage("Unable to send. Try again."); } finally { setBusy(false); }
  }}>{busy ? "Sending…" : "Send password link"}</Button>{message && <p role="status" className="mt-1 max-w-xs text-xs">{message}</p>}</div>;
}
