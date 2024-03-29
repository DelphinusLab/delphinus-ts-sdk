import * as Amount from "../src/lib/amount";
import BN from "bn.js";
import { TokenInfo } from "../src/lib/type";
import {
  getPercentageBN,
  capNumber,
  encodeNum,
} from "../src/lib/helpers/helper";

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

  test("no fraction case", () => {
    let res: Amount.Amount = Amount.fromPreciseWeiRepr(new BN("1000000"), 2);
    expect(res).toEqual({
      wei: 2,
      amount: "10000",
      raw: new BN("1000000"),
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

    expect(res).toEqual(new BN("10000000000000000000000000000000000011101000"));
  });

  test("throw too many decimals", () => {
    let input = {
      wei: 18,
      amount: "1.0000000000000000000000000011101",
    };
    function toAmountInputThrow() {
      Amount.toAmountInput(input.amount, input.wei);
    }

    expect(toAmountInputThrow).toThrow();
  });
});

describe("test getPercentageBN", () => {
  let precision = 1000000;
  test("percentage 0", () => {
    let res: string = getPercentageBN(new BN(100), new BN(0), precision);
    expect(res).toEqual("0.00%");
  });
  test("percentage 100", () => {
    let res: string = getPercentageBN(new BN(100), new BN(100), precision);
    expect(res).toEqual("100.00%");
  });

  test("percentage 3.14", () => {
    let res: string = getPercentageBN(new BN(314), new BN(10000), precision);
    expect(res).toEqual("3.14%");
  });
});
describe("test capNumber", () => {
  test("number 0.0000000000000004", () => {
    let res: string = capNumber("0.0000000000000004");
    expect(res).toEqual("0.0000000000000004");
  });
  test("number 0.099999002939658104", () => {
    let res: string = capNumber("0.099999002939658104");
    expect(res).toEqual("0.09999900...");
  });
  test("number 1.0000002939658104", () => {
    let res: string = capNumber("1.0000002939658104");
    expect(res).toEqual("1.0000002");
  });
  test("number 10000000.099999002939658104", () => {
    let res: string = capNumber("10000000.099999002939658104");
    expect(res).toEqual("10000000");
  });
  test("number 987654321.123456789", () => {
    let res: string = capNumber("987654321.123456789");
    expect(res).toEqual("987654321");
  });
  test("number 500.123456789123456789", () => {
    let res: string = capNumber("500.123456789123456789");
    expect(res).toEqual("500.12345");
  });
  test("number 500.000000000123456789", () => {
    let res: string = capNumber("500.000000000123456789");
    expect(res).toEqual("500.00000");
  });

  test("number 0.000000011", () => {
    let res: string = capNumber("0.000000011");
    expect(res).toEqual("0.00000001...");
  });
});

describe("test encodeNum", () => {
  test("number 0.099999002939658104", () => {
    let res: string = encodeNum("0.099999002939658104");
    expect(res).toEqual("0.099999002939658104");
  });

  test("number 9999999990.099999002939658104", () => {
    let res: string = encodeNum("9999999990.099999002939658104");
    expect(res).toEqual("9,999,999,990.099999002939658104");
  });

  test("capped number 9999999990.099999002939658104", () => {
    let res: string = encodeNum(capNumber("9999999990.099999002939658104"));
    expect(res).toEqual("9,999,999,990");
  });
});
