import BN from "bn.js";
import { getTokenIndex as getTokenIndexFromDeploy } from "delphinus-deployment/src/token-index";
import ServerConfig from "delphinus-deployment/config/server.json";
import { getAPI, getCryptoUtil, stringToBN } from "./api";
import { SubstrateAccountInfo } from "../type";
import { stringNumberToBN } from "./utils";

/* ------------ Query ------------ */
export function compressToken(chainId: string, token: string, query = false) {
  const chainIdString = stringToBN(chainId).toString(16, 24);
  const tokenString = stringToBN(token, "", true).toString(16, 40);
  return new BN(chainIdString + tokenString, 16);
}

export function getTokenIndex(chainId: string, tokenAddress: string) {
  const gTokenAddress = compressToken(chainId, tokenAddress).toString(10);
  return Object.entries(getTokenIndexFromDeploy()).find(
    (x) => x[0] === gTokenAddress
  )![1];
}

export async function querySubstrateBalance(account: string) {
  const api = await getAPI();
  const account_info = await api.query.system.account(account);
  const balance = account_info.data.free.toHuman();
  return balance;
}

export async function queryAccountIndex(accountAddress: string) {
  const api = await getAPI();
  const accountIndexOpt: any = await api.query.swapModule.accountIndexMap(
    accountAddress
  );
  return accountIndexOpt.isNone ? "" : accountIndexOpt.value.toHex();
}

export async function queryL2Nonce(accountAddress: string) {
  const api = await getAPI();
  return (await api.query.swapModule.nonceMap(accountAddress)).toHex();
}

export async function queryTokenAmount(
  l2Account: SubstrateAccountInfo,
  chainId: string,
  tokenAddress: string
) {
  const api = await getAPI();
  const accountAddress = l2Account.address;
  const accountIndex = await queryAccountIndex(accountAddress);
  if (accountIndex === "") {
    return 0;
  }

  const tokenIndex = getTokenIndex(chainId, tokenAddress);
  const pair = [accountIndex, tokenIndex];
  const result = await api.query.swapModule.balanceMap(pair);
  return result;
}

export async function queryPoolAmount(
  poolIndex: number,
  callback: (v1: string, v2: string, v3: string) => void
) {
  try {
    const api = await getAPI();
    const raw = await api.query.swapModule.poolMap(poolIndex);
    const result = raw.toJSON() as number[];
    const amount0 = stringNumberToBN(result[2].toString());
    const amount1 = stringNumberToBN(result[3].toString());
    const amount2 = stringNumberToBN(result[4].toString());

    callback(amount0.toString(), amount1.toString(), amount2.toString());
  } catch (e: any) {
    callback("failed", "failed", "failed");
  }
}

export async function queryPoolIndex(token0: number, token1: number) {
  const poolList = await getPoolList();
  return poolList.find((x) => x[1] === token0 && x[2] === token1)?.[0];
}

export async function queryPoolShare(
  l2Account: SubstrateAccountInfo,
  poolIndex: number,
  callback: (number: string) => void
) {
  try {
    const api = await getAPI();
    const accountAddress = l2Account.address;
    const accountIndex = await queryAccountIndex(accountAddress);
    if (accountIndex === "") {
      callback("0");
    }

    const pair = [accountIndex, poolIndex];
    const share = await api.query.swapModule.shareMap(pair);
    const shareBN = stringNumberToBN(share.toString());
    callback(shareBN.toString());
  } catch (e: any) {
    callback("failed");
  }
}

let poolInfo: any[];

export async function getPoolList() {
  if (!poolInfo) {
    const api = await getAPI();
    const poolEntries = await api.query.swapModule.poolMap.entries();
    poolInfo = poolEntries.map((kv) => {
      const data = (kv[1] as any).value;
      return [
        kv[0].args[0].toString(),
        data[0].toString(),
        data[1].toString(),
      ].map((x) => parseInt(x));
    });
  }
  return poolInfo;
}

export function dataToBN(data: any) {
  if (data.toHex) {
    data = data.toHex();
  }
  return new BN(data.replace(/0x/, ""), 16);
}
//from monitor db, grab all transactions with sender === l2account.address
export async function getAllTransactions(l2Account: SubstrateAccountInfo) {
  const l2Address = l2Account.address;
  const l2Acc = l2Account.account;
  const queryAddr = ServerConfig.address;
  console.log(queryAddr);
  const transactions = await (
    await fetch(queryAddr + "/l2transactions" + `/${l2Address}`)
  ).json(); //change to proper query info
  return transactions;
}
