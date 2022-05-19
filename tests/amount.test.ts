import * as Amount from "../src/lib/amount";
import BN from "bn.js";
import { TokenInfo } from "../src/lib/type";

describe("test fromPreciseWeiRepr", () => {
  test("General number case", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(
      new BN("22000000000"),
      10
    );
    expect(res).toEqual({
      wei: 10,
      amount: "2.2",
      raw: new BN("22000000000"),
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
      amount: "1.1",
      raw: new BN("1100000000000000000"),
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
      amount: "1.0011",
      raw: new BN("1001100000000000000"),
      input: false,
    });
  });

  test("wei 18 case 3", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(new BN("1100000"), 18);
    expect(res).toEqual({
      wei: 18,
      amount: "0.0000000000011",
      raw: new BN("1100000"),
      input: false,
    });
  });

  test("wei 18 case 4", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(
      new BN("10000000000000000000000000100000000000000001"),
      18
    );
    expect(res).toEqual({
      wei: 18,
      amount: "10000000000000000000000000.100000000000000001",
      raw: new BN("10000000000000000000000000100000000000000001"),
      input: false,
    });
  });
});

describe("test toAmountInput", () => {
  test("General number case", () => {
    let input: Amount.Amount = {
      wei: 10,
      amount: "2.2",
      raw: new BN(22000000000),
      input: true,
    };
    let res: BN = Amount.toPreciseWeiRepr(input);
    expect(res).toEqual(new BN("22000000000"));
  });

  test("Throw error case for input false", () => {
    let input: Amount.Amount = {
      wei: 10,
      amount: "2.2",
      raw: new BN("22000000000"),
      input: false,
    };
    function toPreciseWeiReprThrow() {
      Amount.toPreciseWeiRepr(input);
    }
    expect(toPreciseWeiReprThrow).toThrow();
  });

  test("wei 18 case", () => {
    let input = {
      wei: 18,
      amount: "1.1",
    };
    let res: BN = Amount.toAmountInput(input.amount, input.wei).raw;

    expect(res).toEqual(new BN("1100000000000000000"));
  });

  test("wei 18 case 2", () => {
    let input = {
      wei: 18,
      amount: "1.000000000000011101",
    };
    let res: BN = Amount.toAmountInput(input.amount, input.wei).raw;

    expect(res).toEqual(new BN("1000000000000011101"));
  });

  test("wei 18 large number (25 Zeros in whole number component)", () => {
    let input = {
      wei: 18,
      amount: "10000000000000000000000000.000000000011101",
    };
    let res: BN = Amount.toAmountInput(input.amount, input.wei).raw;
    console.log(res.toString());

    expect(res).toEqual(new BN("10000000000000000000000000000000000011101000"));
  });

  test("throw too many decimals", () => {
    let input = {
      wei: 18,
      amount: "1.0000000000000000000000000011101",
    };
    function toPreciseWeiReprThrow() {
      Amount.toAmountInput(input.amount, input.wei);
    }

    expect(toPreciseWeiReprThrow).toThrow();
  });
});
