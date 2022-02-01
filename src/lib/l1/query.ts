import BN from "bn.js";
import { L1AccountInfo, BridgeMetadata } from "../type";
import { withL1Connection } from "solidity/clients/client";
import {
  getConfigByChainId,
  WalletSnap,
} from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";
import { BlockChainClient } from "web3subscriber/src/client";
import { getTokenContractConnection } from "solidity/clients/contracts/token";
import { getBridgeContractConnection } from "solidity/clients/contracts/bridge";
import { decodeL1address } from "web3subscriber/src/addresses";
import { Chains, Tokens } from "solidity/clients/contracts/tokenlist";

export function getTokenIndex(
  metadata: BridgeMetadata,
  chainId: string,
  tokenAddress: string
) {
  const chain = metadata.chainInfo.find((x) => x.chainId === chainId);
  const token = chain?.tokens.find((t) => t.address === tokenAddress);
  return token!.index;
}

function hexcmp(x: string, y: string) {
  const xx = new BN(x, "hex");
  const yy = new BN(y, "hex");
  return xx.eq(yy);
}

export async function queryCurrentL1Account(chainId: string) {
  return await withL1Connection(async (l1Client: BlockChainClient) => {
    return l1Client.encodeL1Address(await l1Client.getAccountInfo());
  }, true, await getConfigByChainId(L1ClientRole.Wallet, chainId));
}

export async function queryTokenL1Balance(
  chainId: string,
  tokenAddress: string,
  l1Account: L1AccountInfo
) {
  return await withL1Connection(async (l1Client: BlockChainClient) => {
    let token = await getTokenContractConnection(l1Client, tokenAddress);
    let balance: BN = await token.balanceOf(l1Account.address);
    return balance.toString(10);
  }, false, await getConfigByChainId(L1ClientRole.Wallet, chainId));
}

export async function prepareMetaData(pool_list: Array<Array<number>>) {
  const config = await getConfigByChainId(L1ClientRole.Wallet, WalletSnap);
  const wrapTokenInfo = (idx: number, token: any) => {
    const uid: BN = token.token_uid;
    console.log(uid);
    const [cid, addr] = decodeL1address(uid.toString());
    return {
      tokenAddress: addr,
      tokenName:
        Tokens.find((x: any) => hexcmp(x.address, addr) && x.chainId == cid)
          ?.name || "unknown",
      chainName: Chains[cid],
      chainId: cid,
      index: idx,
    };
  };

  return await withL1Connection(async (l1Client: BlockChainClient) => {
    const bridge = await getBridgeContractConnection(l1Client);
    const pools = await Promise.all(
      pool_list.map(async (info) => {
        const poolidx = info[0];
        console.log("preparing:", poolidx, info[1], info[2]);
        try {
          const tokens = await bridge.allTokens();
          const t1 = tokens[info[1]];
          const t2 = tokens[info[2]];
          return {
            id: poolidx,
            tokens: [wrapTokenInfo(info[1], t1), wrapTokenInfo(info[2], t2)],
          };
        } catch (e) {
          console.log(e);
          throw e;
        }
      })
    );
    return {
      chainInfo: await bridge.chainInfo(),
      poolInfo: pools,
      snap: WalletSnap,
    };
  }, false, config);
}
