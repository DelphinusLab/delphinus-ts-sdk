import BN from "bn.js";
import { SubstrateAccountInfo} from "../type";
import { L1Client, withL1Client } from "solidity/clients/client";
import { getConfigByChainId } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

const ss58 = require("substrate-ss58");

export async function deposit(
  l2Account: SubstrateAccountInfo,
  chainId: string,
  tokenAddress: string, // hex without 0x prefix
  amount: string,
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
          parseInt(amount),
          token_id
        );
        r.when("snapshot", "Approve", () =>
          progress("Approve", "Wait confirm ...", "", 10)
        )
          .when("Approve", "transactionHash", (tx: string) =>
            progress("Approve", "Transaction Sent", tx, 20)
          )
          .when("Approve", "receipt", (tx: any) =>
            progress("Approve", "Done", tx.blockHash, 30)
          )
          .when("snapshot", "Deposit", () =>
            progress("Deposit", "Wait confirm ...", "", 40)
          )
          .when("Deposit", "transactionHash", (tx: string) =>
            progress("Desposit", "Transaction Sent", tx, 50)
          )
          .when("Deposit", "receipt", (tx: any) =>
            progress("Deposit", "Done", tx.blockHash, 70)
          );
        let tx = await r;
        console.log(tx);
        const p = async () => {
          let tx_status = await querying(tx.transactionHash);
          //FIXME: tx_status:Codec should be parsed to number
          console.log("tx_status", tx_status);
          if (tx_status === "0x00") {
            progress("Waiting for L2 confirm", "Waiting L2", "", 80);
            await setTimeout(() => {}, 1000);
            await p();
          } else if (tx_status === "0x01") {
            //FIXME: we need to put the receipt status into a list for further querying
            progress("Waiting for L2 processing", "Waiting L2", "", 100);
            return;
          } else if (tx_status === "0x02") {
            progress("Finalize", "Done", "", 100);
            return;
          } else throw "Unexpected TxStatus";
        };
        await p();
      } catch (e: any) {
        error(e.message);
      }
    }
  );
}


