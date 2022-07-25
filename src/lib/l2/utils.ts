import BN from "bn.js";

import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { SubstrateAccountInfo } from "../type";
import { queryAccountIndex } from "./info";
import { querySubstrateBalance } from "./info";
import { setKey } from "./tx";

const keyring = new Keyring({ type: "sr25519" });

/* ------------ Account ----------- */

export async function register(account: SubstrateAccountInfo) {
  if ((await queryAccountIndex(account.address)) === "") {
    await setKey(account, undefined, alert);
  } else {
    alert('already registered');
  }
}

export async function tryLoginL2Account(account: string): Promise<SubstrateAccountInfo> {
  const seed = new Uint8Array(
    await window.crypto.subtle.digest(
      "SHA-256",
      Buffer.from(account + "Delphinus")
    )
  );

  await cryptoWaitReady();
  const pair = keyring.addFromSeed(seed);
  const balance = await querySubstrateBalance(pair.address);
  const accountIdx = await queryAccountIndex(pair.address);

  return {
    seed: seed,
    account: accountIdx,
    address: pair.address,
    injector: pair,
    balance: balance,
  };
}


export async function updateGasInfo(accountInfo: SubstrateAccountInfo): Promise<SubstrateAccountInfo> {
  const pair = keyring.addFromSeed(accountInfo.seed);
  const balance = await querySubstrateBalance(pair.address);
  return {...accountInfo,
    balance: balance,
  };
}

//In some big number scenario polkadot API's result from toJSON will return hex number string instead of number string
export function stringNumberToBN(num: string): BN {
  if(num.startsWith("0x"))
    return new BN(num.slice(2), "hex");
  else
    return new BN(num, 10);
}

