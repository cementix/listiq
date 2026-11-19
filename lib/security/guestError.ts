import { SecurityError } from "./errors";

export class GuestRestrictedError extends SecurityError {
  constructor(action = "do this") {
    super(`Demo accounts can't ${action}. Create a free account to unlock it.`);
  }
}
