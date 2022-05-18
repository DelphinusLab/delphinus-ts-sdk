import BN from "bn.js";
import { TokenInfo } from "./type";
export interface Amount {
  wei: number;
  amount: number;
  input: boolean;
}

let zeros = "0";
while (zeros.length < 256) {
  zeros += zeros;
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
  //change to number type
  const amount = Number(whole + "." + fraction);

  return {
    wei: wei,
    amount: amount,
    input: false,
  };
}

export function toPreciseWeiRepr(a: Amount) {
  if (a.input == false) {
    throw new Error(
      "can not convert amount back into precise repr when the amount is not an input"
    );
  } else if (a.amount < 0) {
    throw new Error("amount less than zero");
  } else {
    try {
      //Ethersjs conversion function for reference.
      //https://github.com/ethers-io/ethers.js/blob/8b62aeff9cce44cbd16ff41f8fc01ebb101f8265/packages/bignumber/src.ts/fixednumber.ts#L70
      let multiplier = getMultiplier(a.wei); //Multiplier of converting number into wei units

      const comps = a.amount.toString().split("."); //get whole and fractional parts of input amount
      let whole = comps[0],
        fraction = comps[1];

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

      const wholeWei = new BN(whole)
        .mul(new BN(multiplier))
        .add(new BN(fraction));
      return wholeWei;
    } catch (err) {
      //console.log(err);
      throw new Error("Invalid BN - Please enter a valid number");
    }
  }
}

export function toAmountInput(a: number, wei: number): Amount {
  return {
    wei: wei,
    amount: a,
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
    return "1" + zeros.substring(0, decimals);
  }
  throw new Error("Invalid decimal value");
}
