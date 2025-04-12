import Client, {
  ClientConfig,
  TransactionDetails,
  UnspentTransaction,
  TransactionInput,
  TransactionOutput,
  SignedTransaction,
  Block,
  AddressValidation,
  WalletInfo,
  NetworkInfo,
  PeerInfo,
  MempoolInfo,
  RawMempool,
} from "bitcoin-core";

export interface BitcoinConfig extends ClientConfig {
  network: "mainnet" | "testnet" | "regtest";
}

// Default Polar configuration for Bitcoin Core
const DEFAULT_CONFIG: BitcoinConfig = {
  network: "regtest",
  username: "polaruser",
  password: "polarpass",
  host: "http://127.0.0.1:18443",
  port: 18443, // Default Polar regtest RPC port
  timeout: 30000,
  version: "0.28.0",
};

export class BitcoinClient {
  private client: Client;
  readonly network: string;

  constructor(config: Partial<BitcoinConfig> = {}) {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    console.log("Initializing Bitcoin client with config:", {
      ...finalConfig,
      password: "******", // Hide password in logs
    });
    this.client = new Client(finalConfig);
    this.network = finalConfig.network;
  }

  /**
   * Get the current block height
   */
  async getBlockCount(): Promise<number> {
    return this.client.getBlockCount();
  }

  /**
   * Get a new Bitcoin address
   * @param type - The type of address to generate (legacy, p2sh-segwit, bech32)
   * @param label - Optional label for the address
   */
  async getNewAddress(
    type: "legacy" | "p2sh-segwit" | "bech32" = "bech32",
    label?: string
  ): Promise<string> {
    return this.client.getNewAddress(label, type);
  }

  /**
   * Send Bitcoin to an address
   * @param address - The Bitcoin address to send to
   * @param amount - Amount in BTC
   */
  async sendToAddress(
    address: string,
    amount: number,
    comment?: string
  ): Promise<string> {
    return this.client.sendToAddress(address, amount, comment);
  }

  /**
   * Generate new blocks (regtest only)
   * @param blocks - Number of blocks to generate
   * @param address - Optional address to send the reward to
   */
  async generateToAddress(blocks: number, address: string): Promise<string[]> {
    if (this.network !== "regtest") {
      throw new Error("Block generation is only available in regtest mode");
    }
    return this.client.generateToAddress(blocks, address);
  }

  /**
   * Get transaction details
   * @param txid - Transaction ID
   */
  async getTransaction(txid: string): Promise<TransactionDetails> {
    return this.client.getTransaction(txid);
  }

  /**
   * Get wallet balance
   */
  async getBalance(minconf = 0): Promise<number> {
    return this.client.getBalance(minconf);
  }

  /**
   * List unspent transactions
   * @param minconf - Minimum confirmations (default: 1)
   * @param maxconf - Maximum confirmations (default: 9999999)
   */
  async listUnspent(
    minconf = 0,
    maxconf = 9999999
  ): Promise<UnspentTransaction[]> {
    return this.client.listUnspent(minconf, maxconf);
  }

  /**
   * Create a raw transaction
   * @param inputs - Transaction inputs
   * @param outputs - Transaction outputs
   */
  async createRawTransaction(
    inputs: TransactionInput[],
    outputs: TransactionOutput
  ): Promise<string> {
    return this.client.createRawTransaction(inputs, outputs);
  }

  /**
   * Sign a raw transaction
   * @param txHex - Raw transaction hex
   */
  async signRawTransactionWithWallet(
    txHex: string
  ): Promise<SignedTransaction> {
    return this.client.signRawTransactionWithWallet(txHex);
  }

  /**
   * Send a raw transaction
   * @param txHex - Signed transaction hex
   */
  async sendRawTransaction(txHex: string): Promise<string> {
    return this.client.sendRawTransaction(txHex);
  }

  /**
   * Fund a channel (useful for opening Lightning channels)
   * @param address - The address to send funds to
   * @param amount - Amount in BTC
   * @param confirmations - Number of blocks to generate for confirmation (regtest only)
   */
  async fundAddress(
    address: string,
    amount: number,
    confirmations = 6
  ): Promise<void> {
    const txid = await this.sendToAddress(address, amount);
    const minerAddress = await this.getNewAddress();
    await this.generateToAddress(confirmations, minerAddress);
    console.log(`Funded address ${address} with ${amount} BTC (txid: ${txid})`);
  }

  async getBlock(hash: string, verbosity = 1): Promise<Block> {
    return this.client.getBlock(hash, verbosity);
  }

  async getBlockHash(height: number): Promise<string> {
    return this.client.getBlockHash(height);
  }

  async validateAddress(address: string): Promise<AddressValidation> {
    return this.client.validateAddress(address);
  }

  async listTransactions(count = 10, skip = 0): Promise<TransactionDetails[]> {
    return this.client.listTransactions(count, skip);
  }

  async getWalletInfo(): Promise<WalletInfo> {
    return this.client.getWalletInfo();
  }

  async getPeerInfo(): Promise<PeerInfo[]> {
    return this.client.getPeerInfo();
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      console.log("Fetching network info...");
      const info = await this.client.getNetworkInfo();
      console.log("Network info received:", info);
      return info;
    } catch (error) {
      console.error("Error in getNetworkInfo:", error);
      throw error;
    }
  }

  async getMempoolInfo(): Promise<MempoolInfo> {
    return this.client.getMempoolInfo();
  }

  async getRawMempool(verbose = true): Promise<RawMempool> {
    return this.client.getRawMempool(verbose) as Promise<RawMempool>;
  }

  /**
   * Get raw transaction details
   * @param txid - Transaction ID
   * @param verbose - Whether to return detailed transaction info
   */
  async getRawTransaction(
    txid: string,
    verbose = true
  ): Promise<Record<string, unknown>> {
    return this.client.getRawTransaction(txid, verbose);
  }
}

// Export a default instance
export const bitcoin = new BitcoinClient();
