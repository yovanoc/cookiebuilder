import { SwfReader } from 'xswf';
import { ICallpropvoidInstr, InstructionCode } from 'xswf/dist/abcFile/types/bytecode';
import { IMethodBody } from 'xswf/dist/abcFile/types/methods';
import { IQName, MultinameKind } from 'xswf/dist/abcFile/types/multiname';
import { ITagDoAbc, TagCode } from 'xswf/dist/Types';

const reader = new SwfReader('./tests/DofusInvoker.swf');

const file = reader.getFile();

const doAbc = file.tags.find((tag) => tag.code === TagCode.DoABC) as ITagDoAbc;

const abcFile = doAbc.abcFile;

const messageClasses = abcFile.instances.filter((c) => {
  return c.name.kind === MultinameKind.QName && c.name.ns.name.includes('dofus.network.messages');
});

const bodies = abcFile.methodBodies.filter((m) => m.method.name.includes('deserializeAs_AdminCommandMessage'));

function filterBytecode(method: IMethodBody) {
  const codes = method.code.filter((c) => {
    if (c.code === InstructionCode.Op_debug
      || c.code === InstructionCode.Op_debugfile
      || c.code === InstructionCode.Op_debugline) {
      return;
    }
    return c;
  });
  return codes;
}

bodies.forEach((m) => {
  const codes = filterBytecode(m);

  console.log(`${m.method.name} -> ${JSON.stringify(codes.map((c) => `${InstructionCode[c.code]}`))}`);

  const propvoid = codes.find((c) => c.code === InstructionCode.Op_callpropvoid) as ICallpropvoidInstr;

  const multiname = abcFile.constantPool.multinames[propvoid.operand0] as IQName;

  console.log(multiname.name, multiname.ns.name);

  const contentFunc = abcFile.methodBodies.find((mm) => mm.method.name.includes(multiname.name));

  const codes2 = filterBytecode(contentFunc);

  console.log(`${JSON.stringify(codes2.map((c) => `${InstructionCode[c.code]}`))}`);
});

/*
func (b *builder) ExtractEnum(class as3.Class) (Enum, error) {
	var values []EnumValue
	for _, trait := range class.ClassTraits.Slots {
		if trait.Source.VKind != bytecode.SlotKindInt {
			return Enum{}, fmt.Errorf("enumeration value %v of %v is not an uint", trait.Name, class.Name)
		}
		name := trait.Name
		value := b.abcFile.Source.ConstantPool.Integers[trait.Source.VIndex]
		values = append(values, EnumValue{name, value})
	}
	return Enum{class.Name, values}, nil
}

function extractEnum(as3class: IInstanceInfo) {
  const values = [];
  const slots = as3class.traits.filter((t) => t.kind === TraitKind.Slot) as ITraitSlot[];
  for (const trait of slots) {
    const value = trait.value;
    if (value.kind === ConstantKind.Int) {
      values.push({ name: (trait.name as IQName).name, value: value.val });
    } else {
      const name = (as3class.name as IQName).name;
      throw new Error(`Enumeration value ${(trait.name as IQName).name} of ${name} is not an uint.`);
    }
  }
  return { class: (as3class.name as IQName).name, values };
}

const classs = messageClasses.find((c) => (c.name as IQName).name.includes('AdminCommandMessage'));
// tslint:disable-next-line:no-console
console.log(JSON.stringify(extractEnum(classs), null, 2));
*/
