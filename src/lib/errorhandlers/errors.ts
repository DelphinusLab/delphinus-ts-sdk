import { errorMapping } from "./l2errors";
import { EventRecord } from "@polkadot/types/interfaces/system/types";

export function convertL2Error(errorEvent: EventRecord) {
  const errObj: any = errorEvent?.toJSON();
  let errorModule = errObj?.event?.data[0].module;
  if (errorModule.index === 8) {
    console.log(errorModule.error, "errorIndex from L2");
    let errMsg = errorMapping.find(
      (x) => x.index === errorModule.error
    )?.message;
    return errMsg ? errMsg : "An unknown error was encountered.";
  }
  return "An unexpected error has occured.";
}
