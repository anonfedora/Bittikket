import * as fs from "fs";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { promisify } from "util";
import path from "path";
import {
  LndConfig,
  LndInvoice,
  LndServices,
  LightningService,
  NodeInfo,
  LndInvoiceRequest,
} from "@/types/lnd";

// Default Polar configuration
const DEFAULT_CONFIG: LndConfig = {
  // Adjust these values based on your Polar setup
  rpcServer: "localhost:10001",
  tlsCertPath: "/Users/theophilus/.polar/networks/2/volumes/lnd/alice/tls.cert",
  macaroonPath:
    "/Users/theophilus/.polar/networks/2/volumes/lnd/alice/data/chain/bitcoin/regtest/admin.macaroon",
};

export class LndClient {
  private services: LndServices;
  private config: LndConfig;

  constructor(config: LndConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.services = this.buildServices();
  }

  private buildServices(): LndServices {
    // Load TLS certificate
    const tlsCert = fs.readFileSync(this.config.tlsCertPath);
    const sslCreds = grpc.credentials.createSsl(tlsCert);

    // Load macaroon
    const macaroon = fs.readFileSync(this.config.macaroonPath).toString("hex");
    const metadata = new grpc.Metadata();
    metadata.add("macaroon", macaroon);

    // Create metadata credentials
    const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
      (_context, callback) => callback(null, metadata)
    );

    // Combine the credentials
    const credentials = grpc.credentials.combineChannelCredentials(
      sslCreds,
      macaroonCreds
    );

    // Load the gRPC proto definitions for LND
    const protoPath = path.resolve(process.cwd(), "src/lightning.proto");
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    // We need to use unknown first since the proto types are dynamic
    const lnrpc = protoDescriptor.lnrpc as unknown as {
      Lightning: new (
        host: string,
        credentials: grpc.ChannelCredentials
      ) => LightningService;
    };

    // Create gRPC clients
    const lightning = new lnrpc.Lightning(this.config.rpcServer, credentials);

    return {
      lightning,
      router: null, // Add if needed
      invoices: null, // Add if needed
    };
  }

  // Create an invoice
  async createInvoice(
    amount: number,
    memo: string,
    expiry: number = 3600
  ): Promise<LndInvoice> {
    const call = promisify<LndInvoiceRequest, LndInvoice>(
      this.services.lightning.addInvoice
    ).bind(this.services.lightning);

    const invoice = await call({
      value: amount,
      memo: memo,
      expiry: expiry,
    });

    return invoice;
  }

  // Check invoice payment status
  async checkInvoiceStatus(rHash: Buffer): Promise<LndInvoice> {
    const call = promisify<{ r_hash: Buffer }, LndInvoice>(
      this.services.lightning.lookupInvoice
    ).bind(this.services.lightning);
    return await call({ r_hash: rHash });
  }

  // Get info about the node
  async getInfo(): Promise<NodeInfo> {
    const call = promisify<Record<string, never>, NodeInfo>(
      this.services.lightning.getInfo
    ).bind(this.services.lightning);
    return await call({});
  }
}

export const lndClient = new LndClient();
