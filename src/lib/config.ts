import { ethConfigbyRole } from "delphinus-deployment/config/eth-config";
import { L1ClientRole, ChainConfig } from "delphinus-deployment/src/types";

export function getChainProperty(chainName: string, property: string) {
  const config = ethConfigbyRole(L1ClientRole.Wallet);
  const chain: ChainConfig = config.find((c) => c.chainName === chainName)!;
  if (chain) {
    return chain[property as keyof typeof chain];
  }
}
