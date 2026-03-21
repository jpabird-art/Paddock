import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <FileQuestion className="h-12 w-12 text-gray-400" />
      <h2 className="text-xl font-semibold text-gray-800">Page not found</h2>
      <p className="text-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button className="bg-[#1a2744] hover:bg-[#243560]">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
