"use client";

import { InvoiceGenerator } from "@/app/components/invoice-generator";

export default function HomePage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Lightning Invoice Generator</h1>
        </div>
        <InvoiceGenerator />
      </div>
    </div>
  );
}