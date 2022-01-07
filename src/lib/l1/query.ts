import BN from "bn.js";
import { PoolInfo, L1AccountInfo, SubstrateAccountInfo, BridgeMetadata } from "../type";
import { L1Client, withL1Client } from "solidity/clients/client";
import { DelphinusWeb3, withBrowerWeb3 } from "web3subscriber/src/client";
import {
  getConfigByChainId,
  WalletSnap,
} from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

export function getTokenIndex(
  metadata: BridgeMetadata,
  chainId: string,
  tokenAddress: string
) {
  const chain = metadata.chainInfo.find((x) => x.chainId === chainId);
  const token = chain?.tokens.find((t) => t.address === tokenAddress);
  return token!.index;
}

export async function queryCurrentL1Account(chainId: string) {
  return await withL1Client(
    await getConfigByChainId(L1ClientRole.Wallet, chainId),
    true,
    async (l1client: L1Client) => {
      return l1client.encodeL1Address(l1client.getDefaultAccount());
    }
  );
}

export async function queryTokenL1Balance(
  chainId: string,
  tokenAddress: string,
  l1Account: L1AccountInfo
) {
  let config = await getConfigByChainId(L1ClientRole.Wallet, chainId);
  return withL1Client(config, false, async (l1client: L1Client) => {
    let token = l1client.getTokenContract(
      new BN(tokenAddress, 16).toString(16, 20),
      l1Account.address
    );
    console.log("nid is", await l1client.web3.web3Instance.eth.net.getId());
    console.log("token is", token);
    let balance = await token.balanceOf(l1Account.address);
    return balance;
  });
}

export async function prepareMetaData(pool_list: Array<Array<number>>) {
  let config = await getConfigByChainId(L1ClientRole.Wallet, WalletSnap);
  return await withL1Client(config, false, async (l1client: L1Client) => {
    let bridge = l1client.getBridgeContract();
    console.log("got bridge");
    let pools = await Promise.all(
      pool_list.map(async (info) => {
        let poolidx = info[0];
        console.log("preparing:", poolidx, info[1], info[2]);
        try {
        let t1 = await bridge.getTokenInfo(info[1]);
        let t2 = await bridge.getTokenInfo(info[2]);
        return {
          id: poolidx,
          tokens: [t1, t2],
        };
        } catch(e) {
          console.log(e);
          throw e;
        }
      })
    );
    return {
      chainInfo: (await bridge.getMetaData()).chainInfo,
      poolInfo: pools,
      snap: WalletSnap,
    };
  });
}
