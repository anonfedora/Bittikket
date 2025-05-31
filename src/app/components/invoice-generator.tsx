"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FrontendInvoice } from "@/types/lnd";
import { cn } from "@/lib/utils";

export function InvoiceGenerator() {
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [invoice, setInvoice] = useState<FrontendInvoice | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [invoiceHistory, setInvoiceHistory] = useState<FrontendInvoice[]>([]);

  // Subscribe to invoice updates using server-sent events
  useEffect(() => {
    const eventSource = new EventSource('/api/invoice/subscribe');

    eventSource.onmessage = (event) => {
      const frontendInvoice: FrontendInvoice = JSON.parse(event.data);

      setInvoiceHistory(prev => {
        const existingIndex = prev.findIndex(inv => inv.rHash === frontendInvoice.rHash);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = frontendInvoice;
          return updated;
        }
        return [frontendInvoice, ...prev];
      });

      if (invoice?.rHash === frontendInvoice.rHash) {
        setInvoice(frontendInvoice);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [invoice]);

  // Poll for invoice payment status
  useEffect(() => {
    if (!invoice || invoice.isPaid) return;

    setCheckingPayment(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/invoice/${invoice.rHash}/status`);
        if (!response.ok) {
          throw new Error("Failed to check payment status");
        }

        const data = await response.json();
        if (data.isPaid) {
          setInvoice((prev) => (prev ? { ...prev, isPaid: true } : null));
          toast.success("Payment received!", {
            description: "The invoice has been paid successfully.",
          });
          clearInterval(pollInterval);
          setCheckingPayment(false);
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
      setCheckingPayment(false);
    };
  }, [invoice]);

  const handleGenerateInvoice = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          memo,
          expiry: 3600, // 1 hour
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate invoice");
      }

      const data = await response.json();
      console.log("Invoice generated:", { data });
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (invoice?.paymentRequest) {
      navigator.clipboard.writeText(invoice.paymentRequest);
      toast.success("Copied to clipboard", {
        description: "Invoice has been copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generate Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (sats)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount in satoshis"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">Memo (optional)</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Enter a description for this invoice"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          {invoice && (
            <div
              className={cn(
                "mt-6 space-y-4 transition-all duration-500",
                invoice.isPaid && "opacity-50"
              )}
            >
              {invoice.isPaid ? (
                <div className="flex flex-col items-center justify-center py-8 text-green-600">
                  <CheckCircle2 className="h-24 w-24 animate-in zoom-in" />
                  <p className="mt-4 text-lg font-medium">Payment Received!</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {invoice.amount} sats
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG value={invoice.paymentRequest} size={200} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Invoice</Label>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs break-all font-mono">
                        {invoice.paymentRequest}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Amount:</span>{" "}
                      {invoice.amount} sats
                    </div>
                    <div>
                      <span className="font-medium">Expires in:</span>{" "}
                      {Math.floor(invoice.expiry / 60)} minutes
                    </div>
                  </div>
                  {checkingPayment && (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Waiting for payment...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleGenerateInvoice}
            disabled={loading || !amount || amount <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Invoice"
            )}
          </Button>
        </CardFooter>
      </Card>

      {invoiceHistory.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoiceHistory.map((inv) => (
                <div
                  key={inv.rHash}
                  className={cn(
                    "p-4 rounded-lg border",
                    inv.isPaid ? "bg-green-50 border-green-200" : "bg-white"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{inv.amount} sats</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {inv.paymentRequest}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {inv.isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
