"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2 } from "lucide-react";
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
import { FrontendInvoice } from "@/types";

export function InvoiceGenerator() {
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [invoice, setInvoice] = useState<FrontendInvoice | null>(null);

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
          <div className="mt-6 space-y-4">
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
                <span className="font-medium">Amount:</span> {invoice.amount}{" "}
                sats
              </div>
              <div>
                <span className="font-medium">Expires in:</span>{" "}
                {Math.floor(invoice.expiry / 60)} minutes
              </div>
            </div>
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
  );
}
