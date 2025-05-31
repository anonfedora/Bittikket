import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TicketQRCodeProps {
  ticketId: string;
  eventId: string;
  className?: string;
}

export function TicketQRCode({ ticketId, eventId, className = "" }: TicketQRCodeProps) {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    // Generate QR code with ticket data
    const ticketData = {
      ticketId,
      eventId,
      timestamp: new Date().toISOString(),
    };

    QRCode.toDataURL(JSON.stringify(ticketData))
      .then((url) => {
        setQrCode(url);
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });
  }, [ticketId, eventId]);

  const handleDownload = () => {
    if (!qrCode) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `ticket-${ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrCode) {
    return <div>Loading QR code...</div>;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img src={qrCode} alt="Ticket QR Code" className="w-48 h-48" />
      <p className="mt-2 text-sm text-gray-500">Scan to verify ticket</p>
      <Button
        onClick={handleDownload}
        variant="outline"
        className="mt-4"
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
} 