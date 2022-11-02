import BN from "bn.js";
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
  web3: any;
}

/*
 * Informations that should get via monitor account.
 */

export interface TokenInfo {
  address: string;
  name: string;
  chainId: string;
  index: number;
  wei: number;
  l2Balance?: BN;
  l1Balance?: BN;
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
  wei: number;
  index: number;
}

export interface PoolInfo {
  id: number;
  tokens: TokenInfoFull[];
  totalShare?: string;
  share?: string;
  amount0?: string;
  amount1?: string;
}

export interface BridgeMetadata {
  chainInfo: ChainInfo[];
  poolInfo: PoolInfo[];
  snap: string;
}

export interface BaseExtrinsic {
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  extrinsicHash: string;
  module: string;
  method: string;
  signer: string;
}
