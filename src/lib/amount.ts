import BN from "bn.js";
import { TokenInfo } from "./type";
export interface Amount {
  wei: number;
  amount: number;
  input: boolean;
}

export function fromPreciseWeiRepr(repr: BN, wei: number) {
  let pow_wei = new BN(10).pow(new BN(wei));
  let q = repr.div(pow_wei);
  let r = repr.mod(pow_wei);
  let amount = q.toNumber() + r.toNumber() / 10 ** wei;
  console.log(amount, "fromPreciseWeiRepr");
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
      let decimal = new BN(a.wei);
      let floor = Math.floor(a.amount);
      let r = new BN(floor.toString());
      let w = new BN(10).pow(decimal);
      let minor = (a.amount - floor) * 10 ** a.wei;
      let d = r.mul(w);
      let q = new BN(Math.floor(minor).toString());
      return d.add(q);
    } catch (err) {
      console.log(err);
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
