"use client";

import { useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VerifyTicketPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [ticketId, setTicketId] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    ticket?: {
      id: string;
      eventTitle: string;
      eventDate: string;
      status: string;
      invoiceStatus: string;
    };
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyTicket = async (ticketIdToVerify: string) => {
    setIsLoading(true);
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/events/${eventId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketId: ticketIdToVerify }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify ticket");
      }

      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({
        valid: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyTicket(ticketId);
  };

  const handleQRScan = async (data: { ticketId: string; eventId: string }) => {
    if (data.eventId !== eventId) {
      setVerificationResult({
        valid: false,
        error: "This ticket is for a different event",
      });
      return;
    }
    await verifyTicket(data.ticketId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Verify Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scan" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="scan">
                <QRScanner
                  onScan={handleQRScan}
                  onError={(error) =>
                    setVerificationResult({
                      valid: false,
                      error,
                    })
                  }
                />
              </TabsContent>
              <TabsContent value="manual">
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label
                      htmlFor="ticketId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Ticket ID
                    </label>
                    <Input
                      id="ticketId"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder="Enter ticket ID"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Ticket"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {verificationResult && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  verificationResult.valid
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {verificationResult.valid ? (
                  <div>
                    <p className="font-semibold">Ticket Verified Successfully!</p>
                    <p>Event: {verificationResult.ticket?.eventTitle}</p>
                    <p>Date: {verificationResult.ticket?.eventDate}</p>
                    <p>Status: {verificationResult.ticket?.status}</p>
                    <p>Payment Status: {verificationResult.ticket?.invoiceStatus}</p>
                  </div>
                ) : (
                  <p>{verificationResult.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 