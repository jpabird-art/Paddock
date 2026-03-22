"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LocationForm } from "@/components/admin/LocationForm";
import { useToast } from "@/components/ui/use-toast";

interface Location {
  id: string;
  name: string;
  code: string;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

interface LocationsClientProps {
  locations: Location[];
}

export function LocationsClient({ locations: initialLocations }: LocationsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>(initialLocations);

  function refresh() {
    router.refresh();
  }

  async function toggleActive(location: Location) {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !location.isActive }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to update location.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: location.isActive ? "Location deactivated" : "Location activated",
        description: `${location.name} has been ${location.isActive ? "deactivated" : "activated"}.`,
      });
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {locations.length} location{locations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <LocationForm mode="create" onSuccess={refresh} />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Address</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  No locations found. Add one to get started.
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.id} className={location.isActive ? "" : "opacity-50 bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-gray-900">{location.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">{location.code}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{location.address ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        location.isActive
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {location.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <LocationForm
                        mode="edit"
                        location={location}
                        onSuccess={refresh}
                        trigger={
                          <Button variant="outline" size="sm" className="text-xs h-7">
                            Edit
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => toggleActive(location)}
                      >
                        {location.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
