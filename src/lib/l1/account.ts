import BN from "bn.js";
import { L1AccountInfo, SubstrateAccountInfo, BridgeMetadata } from "../type";
import { L1Client, withL1Client } from "solidity/clients/client";
import { DelphinusWeb3, withBrowerWeb3 } from "web3subscriber/src/client";
import { L1ClientRole } from "delphinus-deployment/src/types";
import {
  getConfigByChainId,
  WalletSnap,
} from "delphinus-deployment/src/config";

export async function loginL1Account() {
  return await withBrowerWeb3(async (web3: DelphinusWeb3) => {
    let i = await web3.getAccountInfo();
    return i;
  });
}

export async function deriveL2Account(l1Account: string) {
  let sign: { [key: string]: string } = await withL1Client(
    await getConfigByChainId(L1ClientRole.Wallet, WalletSnap),
    true,
    async (l1client: L1Client) =>
      new Promise((resolve, reject) =>
        (l1client.web3.web3Instance.currentProvider as any).sendAsync(
          {
            method: "personal_sign",
            params: [
              "Sign this message to derive a CrossChain L2 account, do not expose the signature to other.",
              l1Account,
            ],
            from: l1Account,
          },
          function (err: any, result: any) {
            if (err) {
              reject(err);
            }
            resolve(result);
          }
        )
      )
  );

  return sign.result;
}
