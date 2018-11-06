import { IClassInfo } from "xswf/dist/abcFile/types/classes";
import {
  MultinameInfo,
  MultinameKind
} from "xswf/dist/abcFile/types/multiname";
import {
  INamespaceInfo,
  NamespaceKind
} from "xswf/dist/abcFile/types/namespace";
import { Trait, TraitKind } from "xswf/dist/abcFile/types/trait";

export function findMethodWithPrefix(
  c: IClassInfo,
  prefix: string
): Trait | undefined {
  const methods = c.instance.traits.filter(
    t =>
      t.kind === TraitKind.Method ||
      t.kind === TraitKind.Setter ||
      t.kind === TraitKind.Getter
  );
  for (const t of methods) {
    if (t.name.name.startsWith(prefix)) {
      return t;
    }
  }
}

export function isPublicQName(m: MultinameInfo): boolean {
  if (m.kind !== MultinameKind.QName) {
    return false;
  }
  return isPublicNamespace(m.ns);
}

export function isPublicNamespace(ns: INamespaceInfo): boolean {
  return (
    ns.kind === NamespaceKind.PackageNamespace ||
    ns.kind === NamespaceKind.Namespace
  );
}

export function isAs3ScalarType(t: string): boolean {
  const scalarTypes = ["int", "uint", "float", "bool", "byte"];
  for (const s of scalarTypes) {
    if (t.startsWith(s)) {
      return true;
    }
  }
  return false;
}
