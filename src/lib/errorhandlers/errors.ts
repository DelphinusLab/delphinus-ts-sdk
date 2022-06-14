import { errorMapping } from "./l2errors";
import { EventRecord } from "@polkadot/types/interfaces/system/types";
import { L1Client, withL1Client } from "solidity/clients/client";
import { TransactionConfig, BlockNumber } from "web3-core";
import {
  getConfigByChainId,
  WalletSnap,
} from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

export function convertL2Error(errorEvent: EventRecord) {
  const errObj: any = errorEvent?.toJSON();
  let errorModule = errObj?.event?.data[0].module;
  if (errorModule.index === 8) {
    console.log(errorModule.error, "errorIndex from L2");
    let errMsg = errorMapping.find(
      (x) => x.index === errorModule.error
    )?.message;
    return errMsg ? errMsg : "An unknown error was encountered.";
  }
  console.log(errObj, "Unexpected L2 Error");
  return "An unexpected error has occured.";
}

export async function convertL1Error(error: any, chainId: string) {
  //https://ethereum.stackexchange.com/questions/111252/get-the-real-error-of-transaction-failed
  //Replay the the transaction at block

  //Get existing Tx, replay by calling the tx again

  let config = await getConfigByChainId(L1ClientRole.Wallet, chainId);

  if (error.receipt) {
    //Do EVM Replay
    //get existing tx, and then catch the error from call()

    let res = await withL1Client(config, false, async (l1client: L1Client) => {
      const tx = await l1client.web3.web3Instance.eth.getTransaction(
        error.receipt.transactionHash
      );

      try {
        l1client.web3.web3Instance.eth.handleRevert = true;
        await l1client.web3.web3Instance.eth.call(
          tx as TransactionConfig,
          tx.blockNumber as BlockNumber
        );
      } catch (err: any) {
        console.log({ err }, "Revert Error");
        return err.reason ? err.reason : "An unknown error was encountered.";
      }
    });
    return res;
  }

  return error;
}
