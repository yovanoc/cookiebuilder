const DTypesToTsTypes = new Map([
  ["int16", "number"],
  ["int32", "number"],
  ["int64", "number"],
  ["int8", "number"],
  ["uint32", "number"],
  ["uint8", "number"],
  ["uint16", "number"],
  ["uint64", "number"],
  ["float32", "number"],
  ["float64", "number"],
  ["bool", "boolean"],
  ["string", "string"]
]);

export function getType(type: string) {
  return DTypesToTsTypes.get(type);
}
