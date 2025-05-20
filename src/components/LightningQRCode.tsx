import { QRCodeSVG } from 'qrcode.react';

interface LightningQRCodeProps {
  invoice: string;
  amount: number;
  description: string;
}

export default function LightningQRCode({ invoice, amount, description }: LightningQRCodeProps) {
  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Pay with Lightning</h3>
      <div className="p-2 bg-white rounded">
        <QRCodeSVG value={invoice} size={256} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xl font-bold">{amount} sats</p>
      </div>
      <div className="text-xs text-gray-500 break-all max-w-xs">
        {invoice}
      </div>
    </div>
  );
} 