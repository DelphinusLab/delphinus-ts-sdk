import { errorMapping } from "./l2errors";
import { EventRecord } from "@polkadot/types/interfaces/system/types";

export function convertL2Error(errorEvent: EventRecord) {
  const errObj: any = errorEvent?.toJSON();
  let errorIndex = errObj?.event?.data[0].module.error;
  console.log(errorIndex, "errorIndex from L2");
  let errMsg = errorMapping.find((x) => x.index === errorIndex)?.message;
  return errMsg ? errMsg : "An unknown error was encountered.";
}
