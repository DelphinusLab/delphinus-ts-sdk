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
