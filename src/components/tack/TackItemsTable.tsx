"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const TACK_TYPES = [
  { value: "SADDLE", label: "Saddle" },
  { value: "BRIDLE", label: "Bridle" },
  { value: "BREASTPLATE", label: "Breastplate" },
  { value: "GIRTH", label: "Girth" },
  { value: "NUMNAH", label: "Numnah" },
  { value: "OTHER", label: "Other" },
] as const;

const CONDITIONS = [
  { value: "SERVICEABLE", label: "Serviceable" },
  { value: "UNSERVICEABLE", label: "Unserviceable" },
  { value: "REPAIR_NEEDED", label: "Repair Needed" },
] as const;

const CONDITION_CLASSES: Record<string, string> = {
  SERVICEABLE: "bg-green-100 text-green-700 border-green-200",
  UNSERVICEABLE: "bg-red-100 text-red-700 border-red-200",
  REPAIR_NEEDED: "bg-amber-100 text-amber-700 border-amber-200",
};

interface TackItemData {
  id: string;
  type: string;
  identifier: string;
  brand: string | null;
  condition: string;
  notes: string | null;
  allocations: {
    horse: { id: string; name: string; regimentalNumber: string };
  }[];
}

interface TackItemsTableProps {
  items: TackItemData[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function TackItemsTable({
  items: initialItems,
  canCreate,
  canEdit,
  canDelete,
}: TackItemsTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    type: "SADDLE",
    identifier: "",
    brand: "",
    condition: "SERVICEABLE",
    notes: "",
  });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editItem, setEditItem] = useState<TackItemData | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    identifier: "",
    brand: "",
    condition: "",
    notes: "",
  });

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TackItemData | null>(null);

  function resetAddForm() {
    setAddForm({ type: "SADDLE", identifier: "", brand: "", condition: "SERVICEABLE", notes: "" });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.identifier.trim()) return;

    setAddLoading(true);
    try {
      const res = await fetch("/api/tack/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: addForm.type,
          identifier: addForm.identifier.trim(),
          brand: addForm.brand.trim() || undefined,
          condition: addForm.condition,
          notes: addForm.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.error ?? "Failed to create item.", variant: "destructive" });
        return;
      }

      resetAddForm();
      setAddOpen(false);
      toast({ title: "Item added", description: "Tack item created successfully." });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(item: TackItemData) {
    setEditItem(item);
    setEditForm({
      type: item.type,
      identifier: item.identifier,
      brand: item.brand ?? "",
      condition: item.condition,
      notes: item.notes ?? "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem || !editForm.identifier.trim()) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/tack/items/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type,
          identifier: editForm.identifier.trim(),
          brand: editForm.brand.trim() || null,
          condition: editForm.condition,
          notes: editForm.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.error ?? "Failed to update item.", variant: "destructive" });
        return;
      }

      setEditOpen(false);
      toast({ title: "Item updated", description: "Tack item updated successfully." });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  }

  function openDelete(item: TackItemData) {
    setDeleteItem(item);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteItem) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tack/items/${deleteItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.error ?? "Failed to remove item.", variant: "destructive" });
        return;
      }

      setItems(items.filter((i) => i.id !== deleteItem.id));
      setDeleteOpen(false);
      toast({ title: "Item removed", description: `${deleteItem.identifier} removed from inventory.` });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {canCreate && (
        <div className="flex justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                + Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tack Item</DialogTitle>
                <DialogDescription>Add a new piece of equipment to the inventory.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={addForm.type} onValueChange={(v) => setAddForm({ ...addForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TACK_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Identifier</Label>
                    <Input
                      value={addForm.identifier}
                      onChange={(e) => setAddForm({ ...addForm, identifier: e.target.value })}
                      placeholder="e.g. S-042"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input
                      value={addForm.brand}
                      onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                      placeholder="e.g. Albion"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={addForm.condition} onValueChange={(v) => setAddForm({ ...addForm, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addLoading || !addForm.identifier.trim()} className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                    {addLoading ? "Saving..." : "Add Item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Identifier</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Brand</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Condition</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Allocated To</th>
              {(canEdit || canDelete) && (
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={canEdit || canDelete ? 6 : 5} className="text-center text-gray-500 py-10">
                  No tack items found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const allocation = item.allocations[0];
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-800">
                      {item.identifier}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.brand ?? "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${CONDITION_CLASSES[item.condition] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {item.condition.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {allocation ? (
                        <Link
                          href={`/horses/${allocation.horse.id}`}
                          className="text-[#1a2744] hover:underline font-medium text-xs"
                        >
                          {allocation.horse.name}
                          <span className="text-gray-400 font-mono ml-1">{allocation.horse.regimentalNumber}</span>
                        </Link>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Unallocated</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(item)}
                              className="text-xs text-[#1a2744] hover:underline font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDelete(item)}
                              className="text-xs text-red-600 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tack Item</DialogTitle>
            <DialogDescription>Update details for {editItem?.identifier}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TACK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Identifier</Label>
                <Input
                  value={editForm.identifier}
                  onChange={(e) => setEditForm({ ...editForm, identifier: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={editForm.condition} onValueChange={(v) => setEditForm({ ...editForm, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editLoading || !editForm.identifier.trim()} className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tack Item</DialogTitle>
            <DialogDescription>
              This will remove <strong>{deleteItem?.identifier}</strong> ({deleteItem?.type.replace(/_/g, " ")}) from the inventory. Any current allocations will remain in history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              variant="destructive"
              size="sm"
            >
              {deleteLoading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
