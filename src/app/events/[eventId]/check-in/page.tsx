"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";

export default function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleQRScan = async (data: { ticketId: string; eventId: string }) => {
    if (data.eventId !== eventId) {
      setCheckInResult({
        success: false,
        message: "This ticket is for a different event",
      });
      return;
    }

    try {
      setIsCheckingIn(true);
      setCheckInResult(null);

      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketId: data.ticketId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to check in ticket");
      }

      setCheckInResult({
        success: true,
        message: "Ticket checked in successfully",
      });
      toast.success("Ticket checked in successfully");
    } catch (error) {
      setCheckInResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to check in ticket",
      });
      toast.error(error instanceof Error ? error.message : "Failed to check in ticket");
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Check In Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <QRScanner
                onScan={handleQRScan}
                onError={(error) => {
                  setCheckInResult({
                    success: false,
                    message: error,
                  });
                }}
              />

              {isCheckingIn && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Checking in ticket...</span>
                </div>
              )}

              {checkInResult && (
                <div
                  className={`p-4 rounded-md flex items-center ${
                    checkInResult.success
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {checkInResult.success ? (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <span>{checkInResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 