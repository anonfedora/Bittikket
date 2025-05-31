"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BulkCheckInProps {
  eventId: string;
}

export function BulkCheckIn({ eventId }: BulkCheckInProps) {
  const [ticketNumbers, setTicketNumbers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/check-in/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumbers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process check-ins");
      }

      setResults(data);
      toast.success(`Processed ${data.summary.total} tickets`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process check-ins");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const numbers = e.target.value.split("\n").filter(Boolean);
    setTicketNumbers(numbers);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ticketNumbers">Ticket Numbers</Label>
          <textarea
            id="ticketNumbers"
            className="w-full min-h-[200px] p-2 border rounded-md"
            value={ticketNumbers.join("\n")}
            onChange={handleTicketNumbersChange}
            placeholder="Enter ticket numbers, one per line"
            required
          />
        </div>

        <Button type="submit" disabled={loading || ticketNumbers.length === 0}>
          {loading ? "Processing..." : "Process Check-ins"}
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
              <h4 className="font-semibold mb-2">Failed Check-ins</h4>
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