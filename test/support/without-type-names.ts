export function withoutTypeNames<T>(value: T): unknown {
  if (Array.isArray(value)) return value.map(withoutTypeNames);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "$typeName")
        .map(([key, child]) => [key, withoutTypeNames(child)]),
    );
  }
  return value;
}
