import mainconfig from "../config";
import * as amplitude from "@amplitude/analytics-browser";

amplitude.init(mainconfig.services.amplitude.key);

export function logEvent(eventName, eventParams) {
  amplitude.logEvent(eventName, eventParams);
}