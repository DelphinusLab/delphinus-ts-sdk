import BN from "bn.js";
export const encodeNum = (num: any) => {
  if (num === undefined || num === null) return num;
  let decimalIndex = num.toString().indexOf(".");
  var whole = num
    .toString()
    .substring(0, decimalIndex > -1 ? decimalIndex : num.toString().length);
  let decimal =
    decimalIndex > -1 // No decimal places found
      ? num.toString().substring(decimalIndex + 1, num.toString().length)
      : "";
  //trim leading 0s
  console.log(whole, "whole b4");
  whole = whole.replace(/^0+/, "") || "0";
  console.log(whole, "whole after");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal ? "." + decimal : "")
  );
};

export function getPercentageBN(bn: BN, total: BN, precision: number) {
  if (total.isZero())
    return new BN(0).toNumber().toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2,
    });

  let pct = (bn.mul(new BN(precision)).div(total).toNumber() / precision)
    .toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2,
    })
    .split("%")[0];
  if (pct === "0.00" && bn.gt(new BN(0))) {
    return "<0.01%";
  }
  return pct + "%";
}

//function to cap a number from string format to a certain significant digits
export function capNumber(num: string, significantDigits: number = 8) {
  if (num === undefined || num === null) return num;

  let parts = num.toString().split(".");
  if (parts[0].length >= significantDigits) {
    return parts[0];
  }
  let decimalsToShow = significantDigits - parts[0].length;

  if (parts[1] && parts[1].length > decimalsToShow) {
    //check number of leading 0s in parts[1]
    let zeros = 0;
    for (let i = 0; i < parts[1].length; i++) {
      if (parts[1][i] === "0") zeros++;
      else break;
    }

    return (
      parts[0] +
      "." +
      (zeros > decimalsToShow && parts[0] === "0"
        ? parts[1].substring(0, zeros + 1) + "..."
        : parts[1].substring(0, decimalsToShow))
    );
  }
  return num;
}
