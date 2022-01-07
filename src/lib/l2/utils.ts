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

export async function tryLoginL2Account(account: string) {
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

