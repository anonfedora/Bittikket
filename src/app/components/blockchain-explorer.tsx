"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Array<{
    txid?: string;
    vout?: number;
    scriptSig?: {
      asm: string;
      hex: string;
    };
    sequence: number;
    coinbase?: string;
  }>;
  vout: Array<{
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      type: string;
      addresses?: string[];
    };
  }>;
}

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  weight: number;
  transactions: Transaction[];
  miner: string;
  difficulty: number;
  fees: number;
}

interface ApiBlockData {
  height: number;
  hash: string;
  time: number;
  size: number;
  weight: number;
  tx: Transaction[];
  difficulty: number;
  stats?: {
    miner?: string;
    totalfee?: number;
  };
}

interface MempoolData {
  info: {
    size: number;
    bytes: number;
    usage: number;
    maxmempool: number;
    mempoolminfee: number;
    minrelaytxfee: number;
  };
  transactions: {
    [txid: string]: {
      vsize: number;
      weight: number;
      time: number;
      fees: {
        base: number;
      };
    };
  };
}

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};

function Block({
  block,
  onClick,
  isSelected,
}: {
  block: BlockData | null;
  onClick: (block: BlockData) => void;
  isSelected: boolean;
}) {
  if (!block) return null;

  const date = new Date(block.timestamp * 1000);
  const diffTime = Math.abs(Date.now() - date.getTime());
  const diffMinutes = Math.round(diffTime / (1000 * 60));
  const diffHours = Math.round(diffTime / (1000 * 60 * 60));
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
  const diffYears = Math.round(diffTime / (1000 * 60 * 60 * 24 * 365));

  const timeAgo = () => {
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} months ago`;
    } else {
      return `${diffYears} years ago`;
    }
  };

  return (
    <button
      onClick={() => onClick(block)}
      className={cn(
        "relative p-4 rounded-lg border transition-all cursor-pointer min-w-[200px] w-[200px]",
        isSelected
          ? "bg-zinc-100 border-zinc-300 shadow-sm"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      )}
    >
      <div className="text-center">
        <div className="text-sm font-medium text-zinc-900">Block</div>
        <div className="text-2xl font-bold text-zinc-900">{block.height}</div>
        <div className="text-sm text-zinc-500">
          {block.transactions.length} txs
        </div>
        <div className="text-sm text-zinc-500">{timeAgo()}</div>
      </div>
    </button>
  );
}

function BlockDetails({ block }: { block: BlockData | null }) {
  if (!block) return null;

  const formattedData = {
    height: block.height,
    hash: block.hash || "",
    timestamp: block.timestamp || Date.now() / 1000,
    size: block.size || 0,
    weight: block.weight || 0,
    difficulty: block.difficulty || 0,
    fees: block.fees || 0,
    miner: block.miner || "Unknown",
    transactions: block.transactions || [],
  };

  return (
    <div className="mt-8 bg-white border border-zinc-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">
            Block #{formattedData.height}
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-zinc-500">Hash</div>
              <div className="font-mono text-sm break-all text-zinc-900">
                {formattedData.hash}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-zinc-500">Timestamp</div>
                <div className="text-zinc-900">
                  {new Date(formattedData.timestamp * 1000).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Miner</div>
                <div className="text-zinc-900">{formattedData.miner}</div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Size</div>
                <div className="text-zinc-900">
                  {(formattedData.size / 1000).toFixed(2)} KB
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Weight</div>
                <div className="text-zinc-900">
                  {(formattedData.weight / 1000).toFixed(2)} KWU
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Difficulty</div>
                <div className="text-zinc-900">
                  {formattedData.difficulty.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Fees</div>
                <div className="text-zinc-900">
                  {formattedData.fees.toFixed(8)} BTC
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-zinc-900">Transactions</h3>
            <Badge
              variant="outline"
              className="bg-zinc-50 text-zinc-900 border-zinc-200"
            >
              {formattedData.transactions.length} transaction
              {formattedData.transactions.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {formattedData.transactions.map((tx) => {
              const totalOutput =
                tx.vout?.reduce(
                  (sum, output) => sum + (output.value || 0),
                  0
                ) || 0;

              return (
                <div
                  key={tx.txid}
                  className="bg-zinc-50 p-3 rounded-md text-sm border border-zinc-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-mono text-xs truncate text-zinc-900 w-full flex items-center gap-1">
                      <Link
                        href={`/tx/${tx.txid}`}
                        className="hover:underline cursor-pointer"
                      >
                        {tx.txid?.slice(0, 10)}...{tx.txid?.slice(-10)}
                      </Link>
                      <Copy
                        onClick={() => copyToClipboard(tx.txid)}
                        className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600"
                      />
                    </div>
                    <Link
                      href={`/tx/${tx.txid}`}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <ArrowUpRight className="h-4 w-4 cursor-pointer" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <div>Size: {tx.size || 0} bytes</div>
                    <div>vSize: {tx.vsize || 0} vB</div>
                    <div>Inputs: {tx.vin?.length || 0}</div>
                    <div>Outputs: {tx.vout?.length || 0}</div>
                    <div>
                      Total Output:{" "}
                      <span className="font-mono font-bold">
                        {totalOutput.toFixed(8)} BTC
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MempoolStats({ mempoolData }: { mempoolData: MempoolData | null }) {
  if (!mempoolData) return null;

  const unconfirmedTxs = Object.keys(mempoolData.transactions).length;
  const memoryUsage = `${(mempoolData.info.usage / (1024 * 1024)).toFixed(
    1
  )} MB`;
  const minFee = `${(mempoolData.info.mempoolminfee * 100000000).toFixed(
    1
  )} sat/vB`;
  const medianFee = `${(mempoolData.info.minrelaytxfee * 100000000).toFixed(
    1
  )} sat/vB`;

  const feeRates = {
    low: `${(mempoolData.info.mempoolminfee * 100000000).toFixed(1)} sat/vB`,
    medium: `${(mempoolData.info.minrelaytxfee * 100000000 * 2).toFixed(
      1
    )} sat/vB`,
    high: `${(mempoolData.info.minrelaytxfee * 100000000 * 4).toFixed(
      1
    )} sat/vB`,
    priority: `${(mempoolData.info.minrelaytxfee * 100000000 * 8).toFixed(
      1
    )} sat/vB`,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">
              Unconfirmed Transactions
            </div>
            <div className="text-xl font-bold text-zinc-900">
              {unconfirmedTxs.toLocaleString()}
            </div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Memory Usage</div>
            <div className="text-xl font-bold text-zinc-900">{memoryUsage}</div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Minimum Fee</div>
            <div className="text-xl font-bold text-zinc-900">{minFee}</div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Relay Fee</div>
            <div className="text-xl font-bold text-zinc-900">{medianFee}</div>
          </div>
        </Card>
      </div>

      <div className="mt-8 bg-white border border-zinc-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">
          Transaction Fees
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Low Priority</div>
            <div className="text-lg font-bold text-green-600">
              {feeRates.low}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Medium Priority</div>
            <div className="text-lg font-bold text-yellow-600">
              {feeRates.medium}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">High Priority</div>
            <div className="text-lg font-bold text-orange-600">
              {feeRates.high}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Urgent Priority</div>
            <div className="text-lg font-bold text-red-600">
              {feeRates.priority}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function BlockchainExplorer() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [mempoolData, setMempoolData] = useState<MempoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  async function fetchData() {
    try {
      const [blocksResponse, mempoolResponse] = await Promise.all([
        fetch(`/api/bitcoin/blocks?start=${currentPage}&limit=10`),
        fetch('/api/bitcoin/mempool')
      ]);

      const blocksData = await blocksResponse.json();
      const mempoolData = await mempoolResponse.json();

      // Transform block data to match UI expectations
      const transformedBlocks = blocksData.map((block: ApiBlockData) => ({
        height: block.height,
        hash: block.hash,
        timestamp: block.time,
        size: block.size,
        weight: block.weight,
        transactions: block.tx || [],
        miner: block.stats?.miner || "Unknown",
        difficulty: block.difficulty,
        fees: block.stats?.totalfee || 0
      }));

      // Transform mempool data
      const transformedMempool: MempoolData = {
        info: mempoolData.info,
        transactions: mempoolData.transactions
      };

      setBlocks(transformedBlocks);
      setMempoolData(transformedMempool);
      
      // Set the first block as selected by default if none is selected
      if (!selectedBlock && transformedBlocks.length > 0) {
        setSelectedBlock(transformedBlocks[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch blockchain data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Calculate visible blocks based on window size
  const visibleBlocks = blocks;

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
          <div className="h-96 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Bitcoin Blockchain</h1>
        <Input
          type="search"
          placeholder="Search block / transaction / address"
          className="max-w-sm bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
        />
      </div>

      <div className="relative">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 z-10",
            currentPage === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4 text-zinc-600" />
        </button>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-4 px-6">
            {visibleBlocks.map((block, index) => (
              <Block
                key={`${block.hash}-${block.height}-${index}`}
                block={block}
                onClick={setSelectedBlock}
                isSelected={selectedBlock?.hash === block.hash}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 z-10"
        >
          <ChevronRight className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      <Tabs defaultValue="block" className="mt-8">
        <TabsList className="bg-white border border-zinc-200">
          <TabsTrigger
            value="block"
            className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900"
          >
            Block Details
          </TabsTrigger>
          <TabsTrigger
            value="mempool"
            className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900"
          >
            Mempool
          </TabsTrigger>
        </TabsList>
        <TabsContent value="block">
          <BlockDetails block={selectedBlock} />
        </TabsContent>
        <TabsContent value="mempool">
          <MempoolStats mempoolData={mempoolData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
