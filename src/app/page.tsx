// import InvoiceGenerator from "@/app/components/lightning-invoice";

// export default function Home() {
//   return (
//     <main className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold text-center mb-8">
//         Lightning Invoice Generator
//       </h1>
//       <InvoiceGenerator />
//     </main>
//   );
// }

import { InvoiceGenerator } from "@/app/components/invoice-generator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Lightning Invoice Generator</h1>
        <InvoiceGenerator />
      </div>
    </main>
  )
}