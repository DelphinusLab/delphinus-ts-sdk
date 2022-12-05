import BN from "bn.js";
import { TokenInfoFull, PoolInfo } from "./type";

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
    throw new Error(`Maximum decimals of ${wei} exceeded.`);
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

export const precision = 30;

export function getPoolRatioAmount(
  liquid0: BN,
  liquid1: BN,
  wei0: number,
  wei1: number
): BN | undefined {
  if (liquid0.isZero() && liquid1.isZero()) {
    //if pool is 0,0 liquidity, ratio is undefined
    return undefined;
  }
  if (liquid0.isZero() || liquid1.isZero()) {
    //TODO: handle this case where one pool is 0
    return undefined;
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

export function getSlippageAmount(
  amount: string,
  wei: number,
  slippage: string,
  increase: boolean
): string {
  let input = fractionalToBN(amount, wei);
  let _precision = new BN(10).pow(new BN(precision));
  let slippageBN = fractionalToBN(slippage, precision - 2); // - 2 due to converting from %

  if (increase) {
    slippageBN = _precision.add(slippageBN);
    console.log(_precision.toString(), slippageBN.toString(), "slippage");
  } else {
    slippageBN = _precision.sub(slippageBN);
    console.log(_precision.toString(), slippageBN.toString(), "slippage");
  }
  return fromPreciseWeiRepr(input.mul(slippageBN).div(_precision), wei).amount;
}

export enum PoolOp {
  Supply,
  Retrieve,
  Swap,
}

export function setInputAmount(
  input: string,
  op: PoolOp,
  pool: PoolInfo,
  token0: TokenInfoFull,
  token1: TokenInfoFull,
  liquid0: BN,
  liquid1: BN,
  poolRatio: string,
  inversePoolRatio: string,
  inverse: boolean,
  setAmt0Cb: (amt: string) => void,
  setAmt1Cb: (amt: string) => void,
  error: (err: string) => void
) {
  try {
    //check if token inputs are reversed (ie token1 is on top)
    const reverse = pool.tokens[0].index === token0.index ? false : true;

    //inverse for UI input top token section, reverse for whether the top/bottom token sections are aligned with pool token
    const isInputPoolToken0: boolean =
      (inverse && !reverse) || (!inverse && reverse);

    //convert initial input to BN
    const _input = fractionalToBN(
      input,
      isInputPoolToken0 ? token0.wei : token1.wei
    );

    //Choose to use ratio or inverted ratio depending on input token 0 or 1

    const preciseRatio = fractionalToBN(
      isInputPoolToken0 ? inversePoolRatio : poolRatio,
      precision
    );

    //The poolRatio and inversePoolRatio are displaying pool liquids ratio which had divided wei. Thus need convert to B/E pool ratio
    const token0Multiplier = new BN(10).pow(new BN(token0.wei));
    const token1Multiplier = new BN(10).pow(new BN(token1.wei));
    const preciseRatioBE = isInputPoolToken0
      ? preciseRatio.mul(token1Multiplier).div(token0Multiplier)
      : preciseRatio.mul(token0Multiplier).div(token1Multiplier);

    //precision of calculation
    const precision_multiplier = new BN(10).pow(new BN(precision));

    //rough calculated amount for other token (inverse)
    let amt = _input.mul(preciseRatioBE).div(precision_multiplier);

    //modulous of the above calculation to ensure rounding is met
    let mod = _input.mul(preciseRatioBE).mod(precision_multiplier);
    console.log(amt.toString(), mod.toString(), "amt, mod");

    //round the last digit to account for error and keep pool ratio as expected
    if (!mod.isZero()) {
      //depending on side of pool, add 1 or leave natural to round up or down
      if (op === PoolOp.Retrieve) {
        isInputPoolToken0 ? (amt = amt) : (amt = amt.add(new BN(1)));
      }
      if (op === PoolOp.Supply) {
        isInputPoolToken0 ? (amt = amt.add(new BN(1))) : (amt = amt);
      }
    }
    //Check the pool ratio will fulfull inputX*PoolY - inputY*PoolX >= 0
    //where liquid0 and liquid1 are pool amounts
    if (liquid0 && liquid1) {
      let _in = fractionalToBN(input, token0.wei);
      if (op === PoolOp.Retrieve) {
        if (isInputPoolToken0) {
          let check = _in.mul(liquid1).sub(amt.mul(liquid0)).gte(new BN(0));
          console.log(check, "check if valid inputs");
        } else {
          let check = amt.mul(liquid1).sub(_in.mul(liquid0)).gte(new BN(0));
          console.log(check, "check if valid inputs");
        }
      }
      if (op === PoolOp.Supply) {
        if (isInputPoolToken0) {
          let check = amt.mul(liquid0).sub(_in.mul(liquid1)).gte(new BN(0));
          console.log(check, "check if valid inputs");
        } else {
          let check = _in.mul(liquid0).sub(amt.mul(liquid1)).gte(new BN(0));
          console.log(check, "check if valid inputs");
        }
      }
    }
    //set input amounts for user
    if (inverse) {
      setAmt0Cb(input);

      setAmt1Cb(fromPreciseWeiRepr(amt, token1.wei).amount);
    } else {
      setAmt1Cb(input);

      setAmt0Cb(fromPreciseWeiRepr(amt, token0.wei).amount);
    }
  } catch (err: any) {
    error(err.message);
  }
}

export function setSwapAmount(
  input: string,
  pool: PoolInfo,
  tokenIn: TokenInfoFull,
  tokenOut: TokenInfoFull,
  setPayCb: (amt: string) => void,
  setGetCb: (amt: string) => void,
  error: (err: string) => void
) {
  try {
    setPayCb(input);

    const reverse = pool.tokens[0].index === tokenIn.index ? false : true;

    const _input = fractionalToBN(input, tokenIn.wei);
    console.log(pool.amount1, pool.amount0, "poolamounts");
    //precision of calculation
    const precision_multiplier = new BN(10).pow(new BN(precision));

    const fee = new BN(1021).mul(precision_multiplier).div(new BN(1024));

    //calculation for output token
    let amt = _input
      .mul(new BN(reverse ? pool.amount0! : pool.amount1!))
      .mul(fee)
      .div(
        _input
          .add(new BN(reverse ? pool.amount1! : pool.amount0!))
          .mul(precision_multiplier)
      );

    setGetCb(fromPreciseWeiRepr(amt, tokenOut.wei).amount);
  } catch (err: any) {
    error(err.message);
  }
}

export function setRequiredAmount(
  input: string,
  pool: PoolInfo,
  tokenIn: TokenInfoFull,
  tokenOut: TokenInfoFull,
  setPayCb: (amt: string) => void,
  setGetCb: (amt: string) => void,
  error: (err: string) => void
) {
  try {
    setGetCb(input);

    const reverse = pool.tokens[0].index === tokenIn.index ? false : true;

    const _input = fractionalToBN(input, tokenOut.wei);

    //precision of calculation
    const precision_multiplier = new BN(10).pow(new BN(precision));

    const fee = new BN(1024).mul(precision_multiplier).div(new BN(1021));

    //calculation for input token x_in = (yout * poolX  /poolY* fee) / (1 - yOut/poolY * fee)
    //where fee is the standard 1024/1021 ratio.
    let amt = _input
      .mul(new BN(reverse ? pool.amount1! : pool.amount0!))
      .mul(fee)
      .div(new BN(reverse ? pool.amount0! : pool.amount1!));
    let partial = _input
      .mul(fee)
      .div(new BN(reverse ? pool.amount0! : pool.amount1!));
    let denominator = precision_multiplier.sub(partial);
    console.log(amt.toString(), "amt");
    console.log(partial.toString(), "partial");
    console.log(denominator.toString(), "denominator");
    let final = amt.div(denominator);

    if (final.lt(new BN(0))) {
      throw Error("Not enough liquidity to cover the required amount");
    }
    console.log(final.toString(), "final");
    setPayCb(fromPreciseWeiRepr(final, tokenIn.wei).amount);
  } catch (err: any) {
    error(err.message);
  }
}

export function calcToken1ShareAmount(pool: PoolInfo) {
  //calculate token1 share based off token0 share
  const precision_multiplier = new BN(10).pow(new BN(precision));
  if (!pool.amount0 || pool.amount0 === "0") {
    return new BN(0);
  }
  let token0Share = getUserTokenShare(
    new BN(pool.share!),
    new BN(pool.totalShare!),
    new BN(pool.amount0!)
  );
  let amt = token0Share
    .mul(precision_multiplier)
    .div(new BN(pool.amount0!))
    .mul(new BN(pool.amount1!))
    .div(precision_multiplier);
  console.log(amt.toString(), "TOKEN1 SHARE");

  return amt;
}

export function getUserTokenShare(userShare: BN, poolShare: BN, liq0: BN) {
  if (liq0.isZero() || userShare.isZero() || poolShare.isZero())
    return new BN(0);
  const precision_multiplier = new BN(10).pow(new BN(precision));
  return userShare
    .mul(precision_multiplier)
    .mul(liq0)
    .div(poolShare)
    .div(precision_multiplier);
}

export function disableSwap(
  pool: PoolInfo | undefined,
  poolRatio: string,
  tokenOut: TokenInfoFull | undefined,
  tokenOutAmount: string,
  error: string
) {
  if (!tokenOut) return true;

  //catch error if invalid token amount
  try {
    return (
      !pool ||
      (pool && poolRatio === "0") ||
      toAmountInput(tokenOutAmount, tokenOut.wei).raw.isZero() ||
      !!error
    );
  } catch (e) {
    console.log(e);
    return true;
  }

}
