"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BulkTransferProps {
  eventId: string;
}

interface Transfer {
  ticketNumber: string;
  newOwnerEmail: string;
}

export function BulkTransfer({ eventId }: BulkTransferProps) {
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/tickets/transfer/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transfers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transfers");
      }

      setResults(data);
      toast.success(`Processed ${data.summary.total} transfers`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split("\n").filter(Boolean);
    const newTransfers = lines.map(line => {
      const [ticketNumber, email] = line.split(",").map(s => s.trim());
      return { ticketNumber, newOwnerEmail: email };
    });
    setTransfers(newTransfers);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="transfers">Transfers (Ticket Number, Email)</Label>
          <textarea
            id="transfers"
            className="w-full min-h-[200px] p-2 border rounded-md"
            value={transfers.map(t => `${t.ticketNumber}, ${t.newOwnerEmail}`).join("\n")}
            onChange={handleTransfersChange}
            placeholder="Enter transfers, one per line (e.g., ABC123, user@example.com)"
            required
          />
        </div>

        <Button type="submit" disabled={loading || transfers.length === 0}>
          {loading ? "Processing..." : "Process Transfers"}
        </Button>
      </form>

      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold">{results.summary.total}</div>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <div className="text-sm text-green-500">Successful</div>
              <div className="text-2xl font-bold">{results.summary.successful}</div>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <div className="text-sm text-red-500">Failed</div>
              <div className="text-2xl font-bold">{results.summary.failed}</div>
            </div>
          </div>

          {results.results.some((r: any) => r.status === "error") && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Failed Transfers</h4>
              <div className="space-y-2">
                {results.results
                  .filter((r: any) => r.status === "error")
                  .map((r: any) => (
                    <div key={r.ticketNumber} className="text-sm text-red-500">
                      {r.ticketNumber}: {r.message}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 