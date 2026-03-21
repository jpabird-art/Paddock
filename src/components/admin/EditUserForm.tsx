"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil } from "lucide-react";
import { HC_RANKS } from "@/lib/ranks";

interface EditUserFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    rank: string | null;
    squadron: string | null;
  };
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
    rank: user.rank ?? "",
    squadron: (user.squadron ?? "") as "THE_LIFE_GUARDS" | "THE_BLUES_AND_ROYALS" | "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleRankChange(rankCode: string) {
    const rank = HC_RANKS.find((r) => r.code === rankCode);
    setFormData((prev) => ({
      ...prev,
      rank: rankCode,
      role: (rank?.defaultRole ?? prev.role) as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
    }));
  }

  function resetForm() {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
      rank: user.rank ?? "",
      squadron: (user.squadron ?? "") as "THE_LIFE_GUARDS" | "THE_BLUES_AND_ROYALS" | "",
      password: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Build payload with only changed fields
    const payload: Record<string, unknown> = {};
    if (formData.name !== user.name) payload.name = formData.name;
    if (formData.email !== user.email) payload.email = formData.email;
    if (formData.role !== user.role) payload.role = formData.role;
    if (formData.rank !== (user.rank ?? "")) payload.rank = formData.rank || null;
    if (formData.squadron !== (user.squadron ?? "")) {
      payload.squadron = formData.squadron || null;
    }
    if (formData.password) payload.password = formData.password;

    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing was changed." });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to update user.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User updated",
        description: `${formData.name} has been updated.`,
      });
      setOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User — {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor={`name-${user.id}`}>Full Name</Label>
            <Input
              id={`name-${user.id}`}
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`email-${user.id}`}>Email</Label>
            <Input
              id={`email-${user.id}`}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rank</Label>
              <Select value={formData.rank} onValueChange={handleRankChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  {HC_RANKS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.abbreviation} — {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                System Role
                {formData.rank && (
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">(set by rank)</span>
                )}
              </Label>
              {formData.rank ? (
                <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                  {{ OFFICER: "Officer", VET: "Veterinary", TROOPER: "Trooper", ADMIN: "Admin" }[formData.role]}
                </div>
              ) : (
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: v as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TROOPER">Trooper</SelectItem>
                    <SelectItem value="OFFICER">Officer</SelectItem>
                    <SelectItem value="VET">Veterinary</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {formData.role !== "VET" && (
            <div className="space-y-2">
              <Label>Squadron</Label>
              <Select
                value={formData.squadron}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    squadron: v as "THE_LIFE_GUARDS" | "THE_BLUES_AND_ROYALS",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select squadron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THE_LIFE_GUARDS">The Life Guards</SelectItem>
                  <SelectItem value="THE_BLUES_AND_ROYALS">The Blues and Royals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`password-${user.id}`}>New Password</Label>
            <Input
              id={`password-${user.id}`}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current"
            />
            <p className="text-xs text-gray-400">Only fill in if you want to change the password.</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1a2744] hover:bg-[#243560]"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
