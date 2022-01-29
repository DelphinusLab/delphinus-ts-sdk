import { IKeyringPair } from "@polkadot/types/types";

export interface SubstrateAccountInfo {
  seed: Uint8Array;
  account: string;
  address: string;
  injector: IKeyringPair;
  balance: string;
}

export interface L1AccountInfo {
  address: string;
  chainId: string;
  //chainName: string;
  // web3: any;
}

/*
 * Informations that should get via monitor account.
 */

export interface TokenInfo {
  address: string;
  name: string;
  chainId: string;
  index: number;
  l2Balance?: string;
  l1Balance?: string;
}

export interface ChainInfo {
  chainId: string;
  chainName: string;
  enable: boolean;
  tokens: TokenInfo[];
}

export interface TokenInfoFull {
  tokenAddress: string;
  tokenName: string;
  chainId: string;
  chainName: string;
  index: number;
}

export interface PoolInfo {
  id: number;
  tokens: TokenInfoFull[];
  share?: string;
  amount?: string;
}

export interface BridgeMetadata {
  chainInfo: ChainInfo[];
  poolInfo: PoolInfo[];
  snap: string;
}
