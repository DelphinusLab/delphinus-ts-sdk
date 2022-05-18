import * as Amount from "../src/lib/amount";
import BN from "bn.js";
import { TokenInfo } from "../src/lib/type";

describe("test toAmountInput", () => {
  test("General number case", () => {
    let res: Amount.Amount = Amount.toAmountInput(1, 10);
    expect(res).toEqual({
      wei: 10,
      amount: 1,
      input: true,
    });
  });

  test("e^18 number case", () => {
    let res: Amount.Amount = Amount.toAmountInput(1, 18);
    expect(res).toEqual({
      wei: 18,
      amount: 1,
      input: true,
    });
  });
});

describe("test fromPreciseWeiRepr", () => {
  test("General number case", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(
      new BN("22000000000"),
      10
    );
    expect(res).toEqual({
      wei: 10,
      amount: 2.2,
      input: false,
    });
  });

  test("wei 18 case", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(
      new BN("1100000000000000000"),
      18
    );
    expect(res).toEqual({
      wei: 18,
      amount: 1.1,
      input: false,
    });
  });

  test("wei 18 case 2", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(
      new BN("1001100000000000000"),
      18
    );
    expect(res).toEqual({
      wei: 18,
      amount: 1.0011,
      input: false,
    });
  });
});

describe("test toPreciseWeiRepr", () => {
  test("General number case", () => {
    let input: Amount.Amount = {
      wei: 10,
      amount: 2.2,
      input: true,
    };
    let res: BN = Amount.toPreciseWeiRepr(input);
    expect(res).toEqual(new BN("22000000000"));
  });

  test("Throw error case for input false", () => {
    let input: Amount.Amount = {
      wei: 10,
      amount: 2.2,
      input: false,
    };
    function toPreciseWeiReprThrow() {
      Amount.toPreciseWeiRepr(input);
    }
    expect(toPreciseWeiReprThrow).toThrow();
  });

  test("wei 18 case", () => {
    let input: Amount.Amount = {
      wei: 18,
      amount: 1.1,
      input: true,
    };
    let res: BN = Amount.toPreciseWeiRepr(input);
    expect(res).toEqual(new BN("1100000000000000000"));
  });
});
