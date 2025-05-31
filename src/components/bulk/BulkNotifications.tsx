"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface BulkNotificationsProps {
  eventId: string;
}

export function BulkNotifications({ eventId }: BulkNotificationsProps) {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          filters: status ? { status } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notifications");
      }

      setResults(data);
      toast.success(`Sent ${data.summary.total} notifications`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter email message"
            required
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Filter by Status (Optional)</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tickets</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading || !subject || !message}>
          {loading ? "Sending..." : "Send Notifications"}
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
        </div>
      )}
    </div>
  );
} 