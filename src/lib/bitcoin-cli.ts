import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface BitcoinCliConfig {
  network: "mainnet" | "testnet" | "regtest";
  rpcuser: string;
  rpcpassword: string;
  rpcport: number;
  rpchost: string;
}

interface BlockInfo {
  hash: string;
  confirmations: number;
  size: number;
  strippedsize: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: TransactionInfo[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash?: string;
}

interface BlockStats {
  avgfee: number;
  avgfeerate: number;
  avgtxsize: number;
  blockhash: string;
  feerate_percentiles: number[];
  height: number;
  ins: number;
  maxfee: number;
  maxfeerate: number;
  maxtxsize: number;
  medianfee: number;
  mediantime: number;
  mediantxsize: number;
  minfee: number;
  minfeerate: number;
  mintxsize: number;
  outs: number;
  subsidy: number;
  swtotal_size: number;
  swtotal_weight: number;
  swtxs: number;
  time: number;
  total_out: number;
  total_size: number;
  total_weight: number;
  totalfee: number;
  txs: number;
  utxo_increase: number;
  utxo_size_inc: number;
}

interface TransactionInfo {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  hex: string;
  blockhash?: string;
  confirmations?: number;
  time?: number;
  blocktime?: number;
}

interface TxInput {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
  txinwitness?: string[];
}

interface TxOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
    address?: string;
  };
}

interface MempoolInfo {
  loaded: boolean;
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
}

export interface MempoolEntry {
  fees: {
    base: number;
    modified: number;
    ancestor: number;
    descendant: number;
  };
  size: number;
  fee: number;
  modifiedfee: number;
  time: number;
  height: number;
  descendantcount: number;
  descendantsize: number;
  descendantfees: number;
  ancestorcount: number;
  ancestorsize: number;
  ancestorfees: number;
  depends: string[];
}

interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: string;
  localrelay: boolean;
  timeoffset: number;
  connections: number;
  networkactive: boolean;
  networks: Network[];
  relayfee: number;
  incrementalfee: number;
}

interface Network {
  name: string;
  limited: boolean;
  reachable: boolean;
  proxy: string;
  proxy_randomize_credentials: boolean;
}

interface PeerInfo {
  id: number;
  addr: string;
  addrbind: string;
  addrlocal: string;
  services: string;
  relaytxes: boolean;
  lastsend: number;
  lastrecv: number;
  bytessent: number;
  bytesrecv: number;
  conntime: number;
  timeoffset: number;
  pingtime: number;
  minping: number;
  version: number;
  subver: string;
  inbound: boolean;
  addnode: boolean;
  startingheight: number;
  banscore: number;
  synced_headers: number;
  synced_blocks: number;
}

interface UnspentOutput {
  txid: string;
  vout: number;
  address: string;
  label: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
  solvable: boolean;
  desc: string;
  safe: boolean;
}

const DEFAULT_CONFIG: BitcoinCliConfig = {
  network: "regtest",
  rpcuser: "polaruser",
  rpcpassword: "polarpass",
  rpcport: 18443,
  rpchost: "127.0.0.1",
};

export class BitcoinCLI {
  private config: BitcoinCliConfig;
  private baseCommand: string;

  constructor(config: Partial<BitcoinCliConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.baseCommand = this.buildBaseCommand();
  }

  private buildBaseCommand(): string {
    const networkFlag =
      this.config.network === "mainnet" ? "" : `-${this.config.network}`;
    return `bitcoin-cli ${networkFlag} -rpcconnect=${this.config.rpchost} -rpcuser=${this.config.rpcuser} -rpcpassword=${this.config.rpcpassword} -rpcport=${this.config.rpcport}`;
  }

  private async executeCommand<T>(command: string): Promise<T> {
    try {
      const { stdout, stderr } = await execAsync(
        `${this.baseCommand} ${command}`
      );
      if (stderr) {
        throw new Error(stderr);
      }

      // Handle string responses (like hashes)
      if (
        typeof stdout === "string" &&
        !stdout.startsWith("{") &&
        !stdout.startsWith("[")
      ) {
        return stdout.trim() as unknown as T;
      }

      try {
        return JSON.parse(stdout.trim()) as T;
      } catch (error: unknown) {
        console.error("Failed to parse JSON:", stdout);
        const message =
          error instanceof Error ? error.message : "Unknown parsing error";
        throw new Error(`Failed to parse bitcoin-cli output: ${message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Bitcoin CLI Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Block-related commands
  async getBlockCount(): Promise<number> {
    return this.executeCommand<number>("getblockcount");
  }

  async getBlockHash(height: number): Promise<string> {
    return this.executeCommand<string>(`getblockhash ${height}`);
  }

  async getBlock(hash: string, verbosity = 2): Promise<BlockInfo> {
    return this.executeCommand<BlockInfo>(`getblock ${hash} ${verbosity}`);
  }

  async getBlockStats(hashOrHeight: string | number): Promise<BlockStats> {
    return this.executeCommand<BlockStats>(`getblockstats ${hashOrHeight}`);
  }

  // Chain-related commands
  async getBestBlockHash(): Promise<string> {
    return this.executeCommand<string>("getbestblockhash");
  }

  async getChainTips(): Promise<
    { height: number; hash: string; branchlen: number; status: string }[]
  > {
    return this.executeCommand<
      { height: number; hash: string; branchlen: number; status: string }[]
    >("getchaintips");
  }

  async getDifficulty(): Promise<number> {
    return this.executeCommand<number>("getdifficulty");
  }

  // Mempool-related commands
  async getMempoolInfo(): Promise<MempoolInfo> {
    return this.executeCommand<MempoolInfo>("getmempoolinfo");
  }

  async getRawMempool(
    verbose = false
  ): Promise<string[] | Record<string, MempoolEntry>> {
    return this.executeCommand(`getrawmempool ${verbose}`);
  }

  async getMempoolEntry(txid: string): Promise<MempoolEntry> {
    return this.executeCommand<MempoolEntry>(`getmempoolentry ${txid}`);
  }

  // Transaction-related commands
  async getRawTransaction(
    txid: string,
    verbosity?: 0 | 1 | 2,
    blockhash?: string
  ): Promise<TransactionInfo> {
    const command = blockhash
      ? `getrawtransaction ${txid} ${verbosity || 1} ${blockhash}`
      : `getrawtransaction ${txid} ${verbosity || 1}`;
    return this.executeCommand<TransactionInfo>(command);
  }

  async decodeRawTransaction(hexstring: string): Promise<TransactionInfo> {
    return this.executeCommand<TransactionInfo>(
      `decoderawtransaction ${hexstring}`
    );
  }

  // Network-related commands
  async getNetworkInfo(): Promise<NetworkInfo> {
    return this.executeCommand<NetworkInfo>("getnetworkinfo");
  }

  async getPeerInfo(): Promise<PeerInfo[]> {
    return this.executeCommand<PeerInfo[]>("getpeerinfo");
  }

  // Mining-related commands
  async generateToAddress(nblocks: number, address: string): Promise<string[]> {
    return this.executeCommand<string[]>(
      `generatetoaddress ${nblocks} ${address}`
    );
  }

  async getBlockTemplate(): Promise<{
    version: number;
    rules: string[];
    vbavailable: Record<string, number>;
    vbrequired: number;
    previousblockhash: string;
    transactions: TransactionInfo[];
    coinbaseaux: Record<string, string>;
    coinbasevalue: number;
    longpollid: string;
    target: string;
    mintime: number;
    mutable: string[];
    noncerange: string;
    sigoplimit: number;
    sizelimit: number;
    weightlimit: number;
    curtime: number;
    bits: string;
    height: number;
  }> {
    return this.executeCommand('getblocktemplate \'{"rules": ["segwit"]}\'');
  }

  // Wallet-related commands
  async getNewAddress(label = "", addressType = "bech32"): Promise<string> {
    return this.executeCommand<string>(
      `getnewaddress "${label}" "${addressType}"`
    );
  }

  async getBalance(minconf = 1): Promise<number> {
    return this.executeCommand<number>(`getbalance "*" ${minconf}`);
  }

  async sendToAddress(
    address: string,
    amount: number,
    comment = ""
  ): Promise<string> {
    return this.executeCommand<string>(
      `sendtoaddress ${address} ${amount} "${comment}"`
    );
  }

  async listUnspent(minconf = 1, maxconf = 9999999): Promise<UnspentOutput[]> {
    return this.executeCommand<UnspentOutput[]>(
      `listunspent ${minconf} ${maxconf}`
    );
  }
}

export default BitcoinCLI;
