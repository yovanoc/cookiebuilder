import { ID2ClassField } from ".";

const writeMethodTypesMap = new Map([
  ["writeVarShort", "int16"],
  ["writeVarInt", "int32"],
  ["writeVarLong", "int64"],
  ["writeBoolean", "bool"],
  ["writeByte", "int8"],
  ["writeShort", "int16"],
  ["writeInt", "int32"],
  ["writeUnsignedInt", "uint32"],
  ["writeFloat", "float32"],
  ["writeDouble", "float64"],
  ["writeUTF", "string"]
]);

const typesMap = new Map([
  ["int", "int32"],
  ["uint", "uint32"],
  ["Number", "float32"],
  ["String", "string"],
  ["Object", "uint32"]
]);

export function reduceType(f: ID2ClassField) {
  if (f.type === "Boolean") {
    f.type = "bool";
  }
  let reduced: string | undefined;
  if (f.writeMethod && f.writeMethod !== "") {
    if (f.writeMethod === "writeBytes") {
      // hack to get NetworkDataContainerMessage working
      f.isVector = true;
      f.isDynamicLength = true;
      f.writeLengthMethod = "writeVarInt";
      f.writeMethod = "writeByte";
    }
    reduced = writeMethodTypesMap.get(f.writeMethod);
  } else {
    reduced = typesMap.get(f.type);
  }
  if (reduced) {
    // Sometimes, unsigned variables are written with signed functions
    if (f.type === "uint" && reduced.startsWith("int")) {
      reduced = `u${reduced}`; // dirty but works for intX types
    }
    f.type = reduced;
  }
}

const typesToMethodMap = new Map([
  ["int8", "Int8"],
  ["int16", "Int16"],
  ["int32", "Int32"],
  ["int64", "Int64"],
  ["uint8", "UInt8"],
  ["uint16", "UInt16"],
  ["uint32", "UInt32"],
  ["uint64", "UInt64"],
  ["float32", "Float"],
  ["float64", "Double"],
  ["string", "String"],
  ["bool", "Boolean"]
]);

export function reduceMethod(f: ID2ClassField) {
  let m = typesToMethodMap.get(f.type);
  if (!m || !f.writeMethod || f.writeMethod === "") {
    return;
  }
  if (f.writeMethod.includes("Var")) {
    m = `Var${m}`;
  }
  f.method = m;
}
