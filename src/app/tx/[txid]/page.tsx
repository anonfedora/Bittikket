import { TransactionDetails } from "./transaction-details";

export default async function TransactionPage(props: {
  params: Promise<{ txid: string }>;
}) {
  const params = await props.params;
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <TransactionDetails txid={params.txid} />
    </div>
  );
}
