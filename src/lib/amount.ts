import BN from "bn.js";
import { TokenInfo } from "./type";
export interface Amount {
  wei: number;
  amount: string;
  raw: BN;
  input: boolean;
}

export function fromPreciseWeiRepr(repr: BN, wei: number) {
  //ethersjs format function for reference
  //https://github.com/ethers-io/ethers.js/blob/8b62aeff9cce44cbd16ff41f8fc01ebb101f8265/packages/bignumber/src.ts/fixednumber.ts#L42
  let pow_wei = new BN(10).pow(new BN(wei));
  let multiplier = getMultiplier(wei);
  let whole = repr.div(pow_wei).toString();
  let fraction = repr.mod(pow_wei).toString();
  //add 0s to the start of the fractional/decimal part
  while (fraction.length < multiplier.length - 1) {
    fraction = "0" + fraction;
  }
  //trim trailing 0s
  while (fraction[fraction.length - 1] === "0") {
    fraction = fraction.substring(0, fraction.length - 1);
  }
  let amount = whole;
  if (fraction !== "") {
    amount += "." + fraction;
  }

  const raw = repr;

  return {
    wei: wei,
    amount: amount,
    raw: raw,
    input: false,
  };
}

export function toPreciseWeiRepr(a: Amount): BN {
  if (a.input == false) {
    throw new Error(
      "can not convert amount back into precise repr when the amount is not an input"
    );
  } else {
    return a.raw;
  }
}

export function toAmountInput(a: string, wei: number): Amount {
  //Validate Input string
  //Set BN representation of Input
  let raw = fractionalToBN(a, wei);

  return {
    wei: wei,
    amount: a,
    raw: raw,
    input: true,
  };
}

function getMultiplier(decimals: number): string {
  if (
    typeof decimals === "number" &&
    decimals >= 0 &&
    decimals <= 256 &&
    !(decimals % 1)
  ) {
    return "1" + Array(decimals).fill("0").join("");
  }
  throw new Error("Invalid decimal value");
}

export function fractionalToBN(num: string, wei: number): BN {
  let multiplier = getMultiplier(wei);

  const negative = num.substring(0, 1) === "-";
  if (negative) {
    throw new Error("Negative number encountered");
  }
  let [whole, fraction, ext] = num.split("."); //get whole and fractional parts of input amount
  if (ext !== undefined) throw new Error("too many decimal points");

  if (!whole) {
    whole = "0";
  }
  if (!fraction) {
    fraction = "0";
  }

  // Trim trailing zeros
  while (fraction[fraction.length - 1] === "0") {
    fraction = fraction.substring(0, fraction.length - 1);
  }

  if (fraction.length > multiplier.length - 1) {
    throw new Error("fractional component exceeds decimals");
  }

  if (fraction === "") {
    fraction = "0";
  }

  // Fully pad the string with zeros to get to wei
  while (fraction.length < multiplier.length - 1) {
    fraction += "0";
  }

  const full = new BN(whole).mul(new BN(multiplier)).add(new BN(fraction));

  return full;
}

export function getPoolRatioAmount(
  liquid0: BN,
  liquid1: BN,
  wei0: number,
  wei1: number,
  precision: number
): BN | undefined {
  if (liquid0.isZero() && liquid1.isZero()) {
    //if pool is 0,0 liquidity, ratio is undefined
    return undefined;
  }
  if (liquid0.isZero() || liquid1.isZero()) {
    //TODO: handle this case where one pool is 0
  }
  console.log(liquid0.toString(), liquid1.toString());
  //This is the precision of the pool ratio to return, currently set to 15 as it is the max precision of Javascript roughly
  let _precision = new BN(10).pow(new BN(precision));
  let mult0 = new BN(10).pow(new BN(wei0));
  let mult1 = new BN(10).pow(new BN(wei1));

  //equalize the units of both liquidity pools
  const lrg0 = liquid0.mul(new BN(mult1));
  const lrg1 = liquid1.mul(new BN(mult0));

  console.log(lrg0.toString(), lrg1.toString());

  const ratio = lrg0.mul(_precision).div(lrg1);

  console.log(ratio.toString(), "ratio of pool");

  return ratio;
}
