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
import { ID2Class } from ".";

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

export function generateFlashGeomClasses(packageName: string): ID2Class[] {
  const classesList: ID2Class[] = [];

  classesList.push({
    fields: [
      {
        isVector: false,
        isVectorVector: false,
        name: "x",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "y",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "length",
        type: "float32"
      }
    ],
    name: "Point",
    package: packageName,
    parent: ""
  });
  classesList.push({
    fields: [
      {
        isVector: false,
        isVectorVector: false,
        name: "x",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "y",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "width",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "height",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "top",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "right",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "left",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "bottom",
        type: "int32"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "bottomRight",
        type: "Point"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "topLeft",
        type: "Point"
      },
      {
        isVector: false,
        isVectorVector: false,
        name: "size",
        type: "Point"
      },
    ],
    name: "Rectangle",
    package: packageName,
    parent: ""
  });

  return classesList;
}
