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

    if (privateKeyString.startsWith("suiprivkey1")) {
      // Handle Sui private key format
      const privateKeyB64 = privateKeyString.replace("suiprivkey1", "");

      // Decode base64 to get the raw bytes
      const decoded = fromB64(privateKeyB64);
      console.log("Decoded length:", decoded.length);
      console.log("First few bytes:", Array.from(decoded.slice(0, 10)));

      // For Ed25519, we need exactly 32 bytes for the private key
      // The first byte is usually the key type (0 for Ed25519)
      if (decoded.length >= 33 && decoded[0] === 0) {
        // Skip the first byte (key type) and take next 32 bytes
        const privateKeyBytes = decoded.slice(1, 33);
        adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      } else if (decoded.length === 32) {
        // Direct 32 bytes private key
        adminKeypair = Ed25519Keypair.fromSecretKey(decoded);
      } else if (decoded.length === 64) {
        // 64 bytes might be seed + public key, take first 32
        const privateKeyBytes = decoded.slice(0, 32);
        adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      } else {
        throw new Error(`Unexpected private key length: ${decoded.length}`);
      }
    } else if (privateKeyString.startsWith("0x")) {
      // Handle hex format
      const privateKeyHex = privateKeyString.slice(2);
      const privateKeyBytes = fromHEX(privateKeyHex);
      adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } else {
      // Try direct base64
      const privateKeyBytes = fromB64(privateKeyString);
      adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    }

    if (adminKeypair) {
      const derivedAddress = adminKeypair.getPublicKey().toSuiAddress();
      console.log("Admin keypair configured successfully");
      console.log("Derived address:", derivedAddress);
      console.log("Expected address:", process.env.NEXT_PUBLIC_ADMIN_ADDRESS);
      console.log(
        "Addresses match:",
        derivedAddress === process.env.NEXT_PUBLIC_ADMIN_ADDRESS
      );
    }
  } catch (error) {
    console.error("Error creating admin keypair:", error);
    console.error(
      "Private key format:",
      process.env.ADMIN_PRIVATE_KEY?.substring(0, 20) + "..."
    );
    adminKeypair = null;
  }
} else {
  console.error("ADMIN_PRIVATE_KEY not found in environment variables");
}

export { suiClient, adminKeypair };

// Konstanta untuk contract
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS!;
export const TREASURY_CAP_ID = process.env.NEXT_PUBLIC_TREASURY_CAP_ID!;
export const CONFIG_ID = process.env.NEXT_PUBLIC_CONFIG_ID!;
export const BLACKLIST_ID = process.env.NEXT_PUBLIC_BLACKLIST_ID!;
