import BN from "bn.js";
import { TokenInfo } from "./type";
export interface Amount {
  wei: number;
  amount: number;
  input: boolean;
}

export function fromPreciseWeiRepr(repr: BN, wei:number) {
  let pow_wei = (new BN(10)).pow(new BN(wei));
  let q = repr.div(pow_wei);
  let r = repr.mod(pow_wei);
  let amount = q.toNumber() + r.toNumber()/(10**wei);
  return {
    wei: wei,
    amount: amount,
    input: false
  }
}

export function toPreciseWeiRepr(a: Amount) {
  if(a.input==false) {
    throw new Error("can not convert amount back into precise repr when the amout is not an input");
  } else if (a.amount <0) {
    throw new Error("amount less than zero");
  } else {
    let floor = Math.floor(a.amount);
    let minor = (a.amount - floor)*(10 ** a.wei);
    let r = new BN(floor);
    let w = new BN(10 ** a.wei);
    let d = r.mul(w);
    let q = (new BN(Math.floor(minor)))
    return d.add(q);
  }
}

export function toAmountInput(a: number, wei:number): Amount {
  return {
    wei:wei,
    amount:a,
    input: true,
  }
}
