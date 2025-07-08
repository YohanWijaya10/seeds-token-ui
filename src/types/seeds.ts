export interface SeedsTokenBalance {
  balance: string;
  formattedBalance: string;
  decimals: number;
}

export interface CoinConfig {
  maxSupply: string;
  currentSupply: string;
  mintCapPerTx: string;
  isPaused: boolean;
  admin: string;
  lastMintTime: string;
  mintCooldown: string;
}
