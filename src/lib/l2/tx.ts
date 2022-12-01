import BN from "bn.js";
import { queryPoolIndex, queryAccountIndex, queryL2Nonce } from "./info";
import { SubstrateAccountInfo, TxReceipt } from "../type";
import { SwapHelper, CryptoUtil } from "delphinus-l2-client-helper/src/swap";
import { queryCurrentL1Account } from "../l1/query";
import { getAPI, getCryptoUtil, stringToBN } from "./api";
import { getTokenIndex } from "./info";
import { Amount, toPreciseWeiRepr } from "../amount";
import { convertL2Error } from "../errorhandlers/errors";

/* ------------ Client ----------- */

export async function queryDepositTxStatus(tx: string) {
  const api = await getAPI();
  const tx_status = await api.query.swapModule.l1TxMap(tx);
  //const tx_status = await api.query.swapModule.depositMap(rid);
  //console.log(`queryDepositTxStatus: [tx:${tx}], [rid:${rid}], [status:${tx_status}].`);
  console.log(`queryDepositTxStatus: [tx:${tx}], [status:${tx_status}].`);
  return tx_status.toHex();
}

/*
export async function checkComplete(rid: string) {
  const codec = await api.query.swapModule.completeReqMap(rid);
}
*/

/* ------------ Transaction ------------ */

function sendUntilFinalize(l2Account: SubstrateAccountInfo) {
  return async (method: string, ...args: any[]) => {
    const api = await getAPI();
    const tx = api.tx.swapModule[method](...args);

    const nonceRaw = (
      await api.query.system.account(l2Account.address)
    ).nonce.toNumber();
    const nonce = new BN(nonceRaw);

    let req = await new Promise<[string, string, string]>(
      async (resolve, reject) => {
        console.log("sendUntilFinalize");
        const get_rid = (e: any) => {
          const { event, phase } = e;
          console.log(
            "event get:",
            event.data.toString(),
            event.method,
            event.section
          );
          return event.data[0];
        };
        const unsub = await tx.signAndSend(
          l2Account.injector,
          { nonce },
          async ({ events = [], status }) => {
            console.log("Transaction status:", status.toJSON());
            if (status.isInBlock) {
              console.log(
                `Transaction included at blockHash ${status.asInBlock}`
              );
            }
            if (status.isFinalized) {
              unsub();
              const suc_event = events.find((e) => {
                const { event, phase } = e;
                return event.section == "swapModule";
              });
              const err_event = events.find((e) =>
                api.events.system.ExtrinsicFailed.is(e.event)
              );

              if (err_event) {
                reject(new Error(convertL2Error(err_event).toString()));
              } else {
                const { block } = await api.rpc.chain.getBlock(
                  status.asFinalized
                );
                console.log(`Block number: ${block.header.number}`);
                for (let i = 0; i < block.extrinsics.length; i++) {
                  let extrinsic = block.extrinsics[i];
                  if (
                    suc_event?.phase.isApplyExtrinsic &&
                    suc_event.phase.asApplyExtrinsic.eq(i)
                  ) {
                    const feeInfo = await api.rpc.payment.queryInfo(
                      extrinsic.toHex(),
                      block.header.hash.toHex()
                    );
                    const { weight, partialFee } = feeInfo;
                    console.log(feeInfo.toJSON());
                    const fee = partialFee.toBn().add(weight.toBn());
                    const receipt: TxReceipt = {
                      blockNumber: block.header.number.toNumber(),
                      extrinsicIndex: i,
                      blockHash: block.header.hash.toHex(),
                      fee: fee.toString(),
                    };
                    const tx_id =
                      receipt.blockNumber + "-" + receipt.extrinsicIndex;
                    const rid = get_rid(suc_event);
                    console.log(tx_id.toString(), "tx_id");
                    resolve([tx_id.toString(), rid.toString(), receipt.fee]);
                  }
                }
              }
            }
          }
        );
      }
    );
    return req;
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
  amount: Amount,
  progress?: (
    state: string,
    hint: string,
    receipt: string,
    ratio: number,
    fee: string
  ) => void,
  error?: (m: string) => void
) {
  try {
    console.log("withdraw:", chainId, token);
    const accountAddress = l2Account.address;
    const tokenIndex = getTokenIndex(chainId, token);
    console.log("token index:", tokenIndex);
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

    let tx = await helper.withdraw(
      stringToBN(accountIndex),
      new BN(tokenIndex),
      toPreciseWeiRepr(amount),
      l1account,
      stringToBN(l2nonce)
    );
    console.log("tx finalized at:", tx);
    if (progress) {
      progress("transaction", "done", tx[0], 70, tx[2]);
      progress("finalize", "queued", tx[1], 100, tx[2]);
    }
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function supply(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amount0: Amount,
  amount1: Amount,
  progress?: (
    state: string,
    hint: string,
    receipt: string,
    ratio: number,
    fee: string
  ) => void,
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

    let tx = await helper.poolSupply(
      stringToBN(accountIndex),
      new BN(poolIndex),
      toPreciseWeiRepr(amount0),
      toPreciseWeiRepr(amount1),
      stringToBN(l2nonce)
    );
    console.log("tx finalized at:", tx);
    if (progress) {
      progress("transaction", "done", tx[0], 70, tx[2]);
      progress("finalize", "queued", tx[1], 100, tx[2]);
    }
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function retrieve(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amount0: Amount,
  amount1: Amount,
  progress?: (
    state: string,
    hint: string,
    receipt: string,
    ratio: number,
    fee: string
  ) => void,
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

    let tx = await helper.poolRetrieve(
      stringToBN(accountIndex),
      new BN(poolIndex),
      toPreciseWeiRepr(amount0),
      toPreciseWeiRepr(amount1),
      stringToBN(l2nonce)
    );

    if (progress) {
      progress("transaction", "done", tx[0], 70, tx[2]);
      progress("finalize", "queued", tx[1], 100, tx[2]);
    }
  } catch (e: any) {
    error?.(e.toString());
  }
}

export async function swap(
  l2Account: SubstrateAccountInfo,
  tokenIndex0: number,
  tokenIndex1: number,
  amount0: Amount,
  amount1: Amount,
  progress?: (
    state: string,
    hint: string,
    receipt: string,
    ratio: number,
    fee: string
  ) => void,
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
    const amount = toPreciseWeiRepr(amount0);
    const helper = new SwapHelper(
      Buffer.from(l2Account.seed).toString("hex"),
      sendUntilFinalize(l2Account),
      await getCryptoUtil()
    );

    let tx = await helper.swap(
      stringToBN(accountIndex),
      new BN(poolIndex),
      new BN(reverse ? 1 : 0),
      amount,
      stringToBN(l2nonce)
    );
    console.log("tx finalized at:", tx);

    if (progress) {
      progress("transaction", "done", tx[0], 70, tx[2]);
      progress("finalize", "queued", tx[1], 100, tx[2]);
    }
  } catch (e: any) {
    console.log(e, "Swap Error");
    error?.(e.toString());
  }
}

export async function charge(
  l2Account: SubstrateAccountInfo,
  amount: Amount,
  progress: (a: string) => void,
  error: (a: string) => void
) {
  try {
    progress("Waiting for process.");
    sendUntilFinalize(l2Account)("charge", toPreciseWeiRepr(amount));
  } catch (e: any) {
    error(e.toString());
    return;
  }
}
