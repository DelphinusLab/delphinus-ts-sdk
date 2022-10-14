import BN from "bn.js";
import { getTokenIndex as getTokenIndexFromDeploy } from "delphinus-deployment/src/token-index";
import NodeConfig from "delphinus-deployment/config/substrate-node.json";
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

export async function getTransactionHistory() {
  const api = await getAPI();
  const signedBlock = await api.rpc.chain.getBlock();
  console.log(signedBlock, "latest block");
  console.log(signedBlock.block.header.number.toHex(), "block number");
  //api.at is newer package version
  // const apiAt = await api.at(signedBlock.block.header.hash);
  // signedBlock.block.extrinsics.forEach((ex, index) => {
  //   // the extrinsics are decoded by the API, human-like view
  //   console.log(index, ex.toHuman());

  //   const {
  //     isSigned,
  //     meta,
  //     method: { args, method, section },
  //   } = ex;

  //   // explicit display of name, args & documentation
  //   console.log(
  //     `${section}.${method}(${args.map((a) => a.toString()).join(", ")})`
  //   );
  //   console.log(meta.documentation.map((d) => d.toString()).join("\n"));

  //   // signer/nonce info
  //   if (isSigned) {
  //     console.log(
  //       `signer=${ex.signer.toString()}, nonce=${ex.nonce.toString()}`
  //     );
  //   }
  // });
  //FIRST 50 Blocks
  for (let i = 50; i >= 0; i--) {
    var hash = await api.rpc.chain.getBlockHash(i);
    var events = await api.query.system.events.at(hash);
    var timestamp = await api.query.timestamp.now.at(hash);
    console.log(
      `\n #${i} at timestamp: ${timestamp}, Received ${events.length} events:`
    );

    // loop through the Vec<EventRecord>
    events.forEach((record) => {
      // extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;

      // show what we are busy with
      console.log(
        `\t${event.section}:${event.method}:: (phase=${phase.toString()})`
      );
      console.log(`\t\t${event.meta.documentation.toString()}`);

      // loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      });
    });
  }

  //these are queries for current storage
  const completedTxs = await api.query.swapModule.completeReqMap.entries();
  const pendingTxs = await api.query.swapModule.pendingReqMap.entries(); // pending should almost always be  0-9 length

  return signedBlock.block.header.number.toNumber();
}

export async function getAccountTransactions() {
  console.log(NodeConfig.address);
  const api = await getAPI();
  const completedTxs = await api.query.swapModule.completeReqMap.entries();

  const pendingTxs = await api.query.swapModule.pendingReqMap.entries();

  let rawMap = completedTxs;
  const map = new Map(rawMap.map((kv: any) => [kv[0].args[0].toHex(), kv[1]]));

  let completeData = Array.from(map.entries())
    .map((kv) => [dataToBN(kv[0]), kv[1]] as [BN, any])
    .sort((kv1, kv2) => (kv1[0].sub(kv2[0]).isNeg() ? -1 : 1));

  // for (let tx of completeData) {
  //   console.log(tx[1].toString(), "tx");
  //   let keys = Object.keys(JSON.parse(tx[1].toString()));
  //   console.log(keys, "ops");
  // }
  let rawMap1 = pendingTxs;
  const pendMap = new Map(
    rawMap1.map((kv: any) => [kv[0].args[0].toHex(), kv[1]])
  );

  let pendingData = Array.from(pendMap.entries())
    .map((kv) => [dataToBN(kv[0]), kv[1]] as [BN, any])
    .sort((kv1, kv2) => (kv1[0].sub(kv2[0]).isNeg() ? -1 : 1));

  return [completeData, pendingData];
}
export function dataToBN(data: any) {
  if (data.toHex) {
    data = data.toHex();
  }
  return new BN(data.replace(/0x/, ""), 16);
}
//from monitor db, grab all transactions with sender === l2account.account
export async function getMongoData() {
  let queryAddr = (NodeConfig.address as string).replace("wss://", "http://");
  let events = await (await fetch(queryAddr + ":8090/l2event/0/1000")).json(); //change to proper query info
  return events;
}
