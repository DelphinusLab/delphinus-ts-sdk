import BN from "bn.js";
export const encodeNum = (num: any) => {
  if (num === undefined || num === null) return num;
  var parts = num.toString().split(".");
  //trim leading 0s
  parts[0] = parts[0].replace(/^0+/, "") ? parts[0] : "0";
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (parts[1] ? "." + parts[1] : "")
  );
};

export function getPercentageBN(bn: BN, total: BN, precision: number) {
  if (total.isZero())
    return new BN(0).toNumber().toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2,
    });
  return (
    bn.mul(new BN(precision)).div(total).toNumber() / precision
  ).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  });
}

//function to cap a number from string format to a certain significant digits
export function capNumber(num: string, significantDigits: number = 8) {
  if (num === undefined || num === null) return num;

  let parts = num.toString().split(".");
  if (parts[0].length > significantDigits) {
    return parts[0].substring(0, significantDigits);
  }
  let decimalsToShow = significantDigits - parts[0].length;

  if (parts[1] && parts[1].length > decimalsToShow) {
    //check number of leading 0s in parts[1]
    let zeros = 0;
    for (let i = 0; i < parts[1].length; i++) {
      if (parts[1][i] === "0") zeros++;
      else break;
    }
    //show only the first significant digit past the zeros if too many zeros
    if (parts[0] === "0")
      return "0" + "." + parts[1].substring(0, zeros + 1) + "...";
    //otherwise return capped number
    return (
      parts[0] +
      "." +
      (zeros > decimalsToShow
        ? +parts[1].substring(0, zeros + 1) + "..."
        : parts[1].substring(0, decimalsToShow))
    );
  }
  return num;
}
