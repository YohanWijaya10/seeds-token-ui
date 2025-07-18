import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64, fromHEX } from "@mysten/sui.js/utils";

// Konfigurasi network
const network = process.env.NEXT_PUBLIC_SUI_NETWORK as
  | "devnet"
  | "testnet"
  | "mainnet";
  
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

// Admin keypair (untuk server-side operations)
let adminKeypair: Ed25519Keypair | null = null;

if (process.env.ADMIN_PRIVATE_KEY) {
  try {
    const privateKeyString = process.env.ADMIN_PRIVATE_KEY;

    if (privateKeyString.startsWith("0x")) {
      // Handle hex format
      const privateKeyHex = privateKeyString.slice(2);
      const privateKeyBytes = fromHEX(privateKeyHex);
      adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } else if (privateKeyString.startsWith("suiprivkey1")) {
      // Handle Sui private key format
      const privateKeyB64 = privateKeyString.replace("suiprivkey1", "");
      const decoded = fromB64(privateKeyB64);

      // Try different parsing methods
      if (decoded.length >= 33 && decoded[0] === 0) {
        adminKeypair = Ed25519Keypair.fromSecretKey(decoded.slice(1, 33));
      } else if (decoded.length === 32) {
        adminKeypair = Ed25519Keypair.fromSecretKey(decoded);
      }
    } else {
      // Try direct base64
      const privateKeyBytes = fromB64(privateKeyString);
      adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    }
  } catch (error) {
    console.error("Error creating admin keypair:", error);
    adminKeypair = null;
  }
}

export { suiClient, adminKeypair };

// Konstanta untuk contract
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS!;
export const TREASURY_CAP_ID = process.env.NEXT_PUBLIC_TREASURY_CAP_ID!;
export const CONFIG_ID = process.env.NEXT_PUBLIC_CONFIG_ID!;
export const BLACKLIST_ID = process.env.NEXT_PUBLIC_BLACKLIST_ID!;
