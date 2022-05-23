import BN from "bn.js";
import { SubstrateAccountInfo} from "../type";
import { L1Client, withL1Client } from "solidity/clients/client";
import { getConfigByChainId } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";
import { PromiseBinder } from "web3subscriber/src/pbinder";
import {Amount, toPreciseWeiRepr} from "../amount";

const ss58 = require("substrate-ss58");

function timeout(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function deposit(
  l2Account: SubstrateAccountInfo,
  chainId: string,
  tokenAddress: string, // hex without 0x prefix
  amount: Amount,
  progress: (s: string, h: string, r: string, ratio: number) => void,
  error: (m: string) => void,
  querying: (m: string) => Promise<string>
) {
  const accountAddress = l2Account.address;
  console.log("call deposit", accountAddress, chainId, tokenAddress, amount);
  await withL1Client(
    await getConfigByChainId(L1ClientRole.Wallet, chainId),
    true,
    async (l1client: L1Client) => {
      try {
        let token_address = "0x" + tokenAddress;
        let token_id = ss58.addressToAddressId(accountAddress);
        let tokenContract = l1client.getTokenContract(token_address);
        let BridgeContract = l1client.getBridgeContract();
        let r = BridgeContract.deposit(
          tokenContract,
          toPreciseWeiRepr(amount),
          token_id
        );
        let l1_txhash = "";
        r.when("snapshot", "Approve", () =>
          progress("approve", "Wait confirm ...", "", 10)
        )
        .when("Approve", "transactionHash", (tx: string) =>
          progress("approve", "Transaction Sent", tx, 20)
        )
        .when("Approve", "receipt", (tx: any) =>
          progress("approve", "Done", tx.blockHash, 30)
        )
        .when("snapshot", "Deposit", () =>
          progress("deposit", "Wait confirm ...", "", 40)
        )
        .when("Deposit", "transactionHash", (tx: string) => {
          l1_txhash = tx;
          progress("desposit", "Transaction Sent", tx, 50)
        })
        .when("Deposit", "receipt", (tx: any) =>
          progress("deposit", "Done", tx.blockHash, 70)
        );
        let tx = await r;
        console.log(tx);
        const p = async () => {
          //Querying the l2 tx status of l1 depopsit
          let tx_status = await querying(l1_txhash);
          console.log("tx_status", tx_status);
          if (tx_status === "0x00") {
            progress("finalize", "Waiting L2", "", 80);
            await timeout(5000);
            await p();
          } else if (tx_status === "0x01") {
            //FIXME: we need to put the receipt status into a list for further querying
            progress("finalize", "Done", "", 100);
            return;
          } else if (tx_status === "0x02") {
            progress("finalize", "Done", "", 100);
            return;
          } else {
            console.log("waiting for tx status ...");
            await timeout(5000);
            await p();
            //throw "Unexpected TxStatus";
          }
        };
        await p();
      } catch (e: any) {
        error(e.message);
      }
    }
  );
}


export async function faucet(
  chainId: string,
  tokenAddress: string, // hex without 0x prefix
  amount: Amount,
  progress: (s: string, h: string, r: string, ratio: number) => void,
  error: (m: string) => void,
) {
  console.log("call deposit", chainId, tokenAddress, amount);
  await withL1Client(
    await getConfigByChainId(L1ClientRole.Wallet, chainId),
    true,
    async (l1client: L1Client) => {
      try {
        let token_address = "0x" + tokenAddress;
        let tokenContract = l1client.getTokenContract(token_address);
        let pbinder = new PromiseBinder();
        let r = pbinder.return(async () => {
          return await pbinder.bind(
            "Mint",
            tokenContract.mint(toPreciseWeiRepr(amount))
          );
        });
        let l1_txhash = "";
        r.when("Mint", "transactionHash", (tx: string) =>
          progress("mint", "Transaction Sent", tx, 20)
        )
        .when("Mint", "receipt", (tx: any) =>
          progress("mint", "Done", tx.blockHash, 100)
        )
        let tx = await r;
      } catch (e: any) {
        error(e.message);
      }
    }
  );
}

