export interface SeedsTokenBalance {
  balance: string;
  formattedBalance: string;
  decimals: number;
}

export interface TransferData {
  amount: number;
  recipient: string;
  from?: string;
}

export interface BurnData {
  amount: number;
  from?: string;
}

export interface TransferResult {
  transactionDigest: string;
  amount: number;
  formattedAmount: number;
  recipient: string;
  from: string;
  gasUsed?: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    nonRefundableStorageFee: string;
  };
}

export interface BurnResult {
  transactionDigest: string;
  amount: number;
  formattedAmount: number;
  from: string;
  gasUsed?: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    nonRefundableStorageFee: string;
  };
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
