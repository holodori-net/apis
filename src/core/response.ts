import { HolodoriApiError } from "./errors.js";

export function requireResponseString(
  value: string,
  field: string,
  path: string,
): string {
  if (value.length === 0) {
    throw new HolodoriApiError(`response has no ${field}`, path);
  }
  return value;
}
