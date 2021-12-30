import BN from "bn.js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { CryptoUtil } from "delphinus-l2-client-helper/src/swap";
import { getSubstrateNodeConfig } from "delphinus-deployment/src/config";
import l2types from "delphinus-l2-client-helper/src/swap-types.json";

export function stringToBN(v: string, name = "", hex = false) {
  try {
    if (v.startsWith("0x")) {
      hex = true;
      v = v.substr(2);
    }
    return new BN(v, hex ? 16 : 10);
  } catch (e: any) {
    throw new Error(`Invalid ${name}: ${v}`);
  }
}


let api: ApiPromise;

let cryptoUtil: CryptoUtil;
let cryptoUtilPromise = import(
  "../../../node_modules/delphinus-crypto/web/pkg"
).then((module) => {
  cryptoUtil = module;
  return module;
});

export async function getCryptoUtil() {
  if (cryptoUtil) {
    return cryptoUtil;
  }
  return await cryptoUtilPromise;
}

export async function getAPI() {
  if (!api?.isConnected) {
    let config = await getSubstrateNodeConfig();
    const provider = new WsProvider(`${config.address}:${config.port}`);
    api = await ApiPromise.create({ provider, types: l2types });
  }
  return api;
}


