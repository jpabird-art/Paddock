"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
import { UserPlus } from "lucide-react";
import { HC_RANKS } from "@/lib/ranks";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  serviceNumber: z.string().min(1, "Service number is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "VET", "OFFICER", "TROOPER"]),
  rank: z.string().optional(),
});

export function CreateUserForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [formData, setFormData] = useState({
    name: "",
    serviceNumber: "",
    email: "",
    password: "",
    role: "TROOPER" as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
    rank: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleRankChange(rankCode: string) {
    const rank = HC_RANKS.find((r) => r.code === rankCode);
    setFormData((prev) => ({
      ...prev,
      rank: rankCode,
      role: (rank?.defaultRole ?? prev.role) as "ADMIN" | "VET" | "OFFICER" | "TROOPER",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parse = schema.safeParse({
      ...formData,
      rank: formData.rank || undefined,
    });
    if (!parse.success) {
      const fieldErrors: typeof errors = {};
      parse.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parse.data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to create user.",
          variant: "destructive",
        });
        return;
      }

      const user = await res.json();
      toast({
        title: "User created",
        description: `${user.name} added to the system.`,
      });
      setOpen(false);
      setFormData({ name: "", serviceNumber: "", email: "", password: "", role: "TROOPER", rank: "" });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1a2744] hover:bg-[#243560]">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Smith"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceNumber">Service Number</Label>
            <Input
              id="serviceNumber"
              name="serviceNumber"
              value={formData.serviceNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  serviceNumber: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. TRP003"
              className="font-mono"
            />
            {errors.serviceNumber && (
              <p className="text-sm text-red-600">{errors.serviceNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. j.smith@hcmr.mod.uk"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rank</Label>
              <Select
                value={formData.rank}
                onValueChange={handleRankChange}
              >
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
                {formData.rank ? (
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">(set by rank)</span>
                ) : (
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">(no rank selected)</span>
                )}
              </Label>
              {formData.rank ? (
                <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                  {{
                    OFFICER: "Officer",
                    VET: "Veterinary",
                    TROOPER: "Trooper",
                    ADMIN: "Admin",
                  }[formData.role]}
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
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
