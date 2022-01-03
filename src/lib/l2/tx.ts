import BN from "bn.js";
import {
    queryPoolIndex,
    queryAccountIndex,
    queryL2Nonce
} from "./info";
import { SubstrateAccountInfo } from "../type";
import { SwapHelper, CryptoUtil } from "delphinus-l2-client-helper/src/swap";
import { queryCurrentL1Account } from "../l1/query";
import { getAPI, getCryptoUtil, stringToBN } from "./api";
import { getTokenIndex } from "./info";

/* ------------ Client ----------- */

export async function queryDepositTxStatus(tx: string) {
  const api = await getAPI();
  const tx_status = await api.query.swapModule.depositMap(tx);
  return tx_status.toHex();
}


/* ------------ Transaction ------------ */

function sendUntilFinalize(l2Account: SubstrateAccountInfo) {
  return async (method: string, ...args: any[]) => {
    const api = await getAPI();
    const tx = api.tx.swapModule[method](...args);

    const nonceRaw = (
      await api.query.system.account(l2Account.address)
    ).nonce.toNumber();
    const nonce = new BN(nonceRaw);

    await new Promise(async (resolve, reject) => {
      const unsub = await tx.signAndSend(
        l2Account.injector,
        { nonce },
        ({ events = [], status }) => {
          if (status.isFinalized) {
            unsub();
            const err_event = events.find((e) =>
              api.events.system.ExtrinsicFailed.is(e.event)
            );
            err_event
              ? reject(new Error(err_event.toString()))
              : resolve(undefined);
          }
        }
      );
    });
  };
}

export async function setKey(
  l2Account: SubstrateAccountInfo,
  progress?: (m: string) => void,
  error?: (m: string) => void
) {
  try {
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    await helper.setKey();
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function withdraw(
  l2Account: SubstrateAccountInfo,
  chainId: string,
  token: string,
  amount: string,
  progress?: (m: string) => void,
  error?: (m: string) => void
) {
  try {
    const accountAddress = l2Account.address;
    const tokenIndex = getTokenIndex(chainId, token);
    const accountIndex = await queryAccountIndex(accountAddress);
    if (accountIndex === "") {
        console.log("query index:", accountIndex);
        throw "Account has not been activated";
    }
    const l2nonce = await queryL2Nonce(accountAddress);
    const l1account = await queryCurrentL1Account(chainId);
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    await helper.withdraw(
      stringToBN(accountIndex),
      new BN(tokenIndex),
      stringToBN(amount),
      l1account,
      stringToBN(l2nonce)
    );
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function supply(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amount0: string,
  amount1: string,
  progress?: (m: string) => void,
  error?: (m: string) => void
) {
  try {
    const reverse = tokenIndex0 > tokenIndex1;
    const poolIndex = await (reverse
      ? queryPoolIndex(tokenIndex1, tokenIndex0)
      : queryPoolIndex(tokenIndex0, tokenIndex1));
    const accountAddress = l2Account.address;
    const accountIndex = await queryAccountIndex(accountAddress);
    const l2nonce = await queryL2Nonce(accountAddress);
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    await helper.poolSupply(
      stringToBN(accountIndex),
      new BN(poolIndex),
      stringToBN(amount0),
      stringToBN(amount1),
      stringToBN(l2nonce)
    );
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function retrieve(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amount0: string,
  amount1: string,
  progress?: (m: string) => void,
  error?: (m: string) => void
) {
  try {
    const reverse = tokenIndex0 > tokenIndex1;
    const poolIndex = await (reverse
      ? queryPoolIndex(tokenIndex1, tokenIndex0)
      : queryPoolIndex(tokenIndex0, tokenIndex1));
    const accountAddress = l2Account.address;
    const accountIndex = await queryAccountIndex(accountAddress);
    const l2nonce = await queryL2Nonce(accountAddress);
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    await helper.poolRetrieve(
      stringToBN(accountIndex),
      new BN(poolIndex),
      stringToBN(amount0),
      stringToBN(amount1),
      stringToBN(l2nonce)
    );
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function swap(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amountRaw: string,
  progress?: (m: string) => void,
  error?: (m: string) => void
) {
  try {
    const reverse = tokenIndex0 > tokenIndex1;
    const poolIndex = await (reverse
      ? queryPoolIndex(tokenIndex1, tokenIndex0)
      : queryPoolIndex(tokenIndex0, tokenIndex1));

    const accountAddress = l2Account.address;
    const accountIndex = await queryAccountIndex(accountAddress);
    const l2nonce = await queryL2Nonce(accountAddress);
    const amount = stringToBN(amountRaw, "withdraw amount");
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    await helper.swap(
      stringToBN(accountIndex),
      new BN(poolIndex),
      new BN(reverse ? 1 : 0),
      amount,
      stringToBN(l2nonce)
    );
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function charge(
  l2Account: SubstrateAccountInfo,
  amount: string,
  progress: (a: string) => void,
  error: (a: string) => void
) {
  try {
    progress("Waiting for process.");
    sendUntilFinalize(l2Account)("charge", stringToBN(amount));
  } catch (e: any) {
    error(e.toString());
    return;
  }
}


