declare module "bitcoin-core" {
  export interface ClientConfig {
    network?: string;
    username: string;
    password: string;
    host: string;
    port: number;
    ssl?: boolean;
    timeout?: number;
    version?: string;
  }

  export interface TransactionDetails {
    amount: number;
    fee: number;
    confirmations: number;
    txid: string;
    time: number;
    timereceived: number;
    "bip125-replaceable": "yes" | "no" | "unknown";
    details: {
      address: string;
      category: "send" | "receive";
      amount: number;
      label?: string;
      vout: number;
    }[];
    hex: string;
  }

  export interface UnspentTransaction {
    txid: string;
    vout: number;
    address: string;
    label?: string;
    scriptPubKey: string;
    amount: number;
    confirmations: number;
    spendable: boolean;
    solvable: boolean;
    safe: boolean;
  }

  export interface TransactionInput {
    txid: string;
    vout: number;
  }

  export interface TransactionOutput {
    [address: string]: number;
  }

  export interface SignedTransaction {
    hex: string;
    complete: boolean;
    errors?: { error: string; txid: string }[];
  }

  export interface Block {
    hash: string;
    confirmations: number;
    size: number;
    strippedsize: number;
    weight: number;
    height: number;
    version: number;
    versionHex: string;
    merkleroot: string;
    tx: string[];
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    nTx: number;
    previousblockhash?: string;
    nextblockhash?: string;
  }

  export interface AddressValidation {
    isvalid: boolean;
    address: string;
    scriptPubKey: string;
    isscript: boolean;
    iswitness: boolean;
    witness_version?: number;
    witness_program?: string;
  }

  export interface WalletInfo {
    walletname: string;
    walletversion: number;
    balance: number;
    unconfirmed_balance: number;
    immature_balance: number;
    txcount: number;
    keypoololdest: number;
    keypoolsize: number;
    paytxfee: number;
    private_keys_enabled: boolean;
    avoid_reuse: boolean;
    scanning: boolean;
  }

  export interface NetworkInfo {
    version: number;
    subversion: string;
    protocolversion: number;
    localservices: string;
    localrelay: boolean;
    timeoffset: number;
    networkactive: boolean;
    connections: number;
    networks: {
      name: string;
      limited: boolean;
      reachable: boolean;
      proxy: string;
      proxy_randomize_credentials: boolean;
    }[];
    relayfee: number;
    incrementalfee: number;
    localaddresses: { address: string; port: number; score: number }[];
    warnings: string;
  }

  export interface PeerInfo {
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
    inflight: number[];
    whitelisted: boolean;
    permissions: string[];
    minfeefilter: number;
    bytessent_per_msg: { [key: string]: number };
    bytesrecv_per_msg: { [key: string]: number };
  }

  export interface MempoolInfo {
    loaded: boolean;
    size: number;
    bytes: number;
    usage: number;
    maxmempool: number;
    mempoolminfee: number;
    minrelaytxfee: number;
  }

  export interface RawMempool {
    [txid: string]: {
      vsize: number;
      weight: number;
      time: number;
      height: number;
      descendantcount: number;
      descendantsize: number;
      ancestorcount: number;
      ancestorsize: number;
      wtxid: string;
      fees: {
        base: number;
        modified: number;
        ancestor: number;
        descendant: number;
      };
      depends: string[];
      spentby: string[];
      'bip125-replaceable': boolean;
    };
  }

  export default class Client {
    constructor(config: ClientConfig);

    getMempoolInfo(): Promise<MempoolInfo>;
    getRawMempool(verbose?: boolean): Promise<string[] | RawMempool>;
    getBlockCount(): Promise<number>;
    getBlock(hash: string, verbosity?: number): Promise<Block>;
    getBlockHash(height: number): Promise<string>;
    getNewAddress(
      label?: string,
      type?: "legacy" | "p2sh-segwit" | "bech32"
    ): Promise<string>;
    validateAddress(address: string): Promise<AddressValidation>;
    sendToAddress(
      address: string,
      amount: number,
      comment?: string
    ): Promise<string>;
    generateToAddress(blocks: number, address: string): Promise<string[]>;
    getTransaction(txid: string): Promise<TransactionDetails>;
    listTransactions(
      count?: number,
      skip?: number
    ): Promise<TransactionDetails[]>;
    getBalance(minconf?: number): Promise<number>;
    getWalletInfo(): Promise<WalletInfo>;
    listUnspent(
      minconf?: number,
      maxconf?: number
    ): Promise<UnspentTransaction[]>;
    createRawTransaction(
      inputs: TransactionInput[],
      outputs: TransactionOutput
    ): Promise<string>;
    signRawTransactionWithWallet(txHex: string): Promise<SignedTransaction>;
    sendRawTransaction(txHex: string): Promise<string>;
    getPeerInfo(): Promise<PeerInfo[]>;
    getNetworkInfo(): Promise<NetworkInfo>;
  }
}
