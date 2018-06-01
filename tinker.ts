import { SwfReader } from 'xswf';
import { ICallpropvoidInstr, InstructionCode, Instruction, IThrowInstr, IGetpropertyInstr, IGetlocal0Instr, IGetlocal1Instr, IGetlocalInstr, ISetlocalInstr } from 'xswf/dist/abcFile/types/bytecode';
import { IMethodBody } from 'xswf/dist/abcFile/types/methods';
import { IQName, MultinameKind } from 'xswf/dist/abcFile/types/multiname';
import { ITagDoAbc, TagCode } from 'xswf/dist/Types';
import { IClassInfo } from '../xswf/dist/abcFile/types/classes';
import { IInstanceInfo } from '../xswf/dist/abcFile/types/instance';
import { TraitKind } from '../xswf/dist/abcFile/types/trait';
import { ConstantKind } from '../xswf/dist/abcFile/types/constant';

import { extractD2Enums } from './src/D2EnumExtractor';

const reader = new SwfReader('./tests/DofusInvoker-2.swf');

const file = reader.getFile();

const doAbc = file.tags.find((tag) => tag.code === TagCode.DoABC) as ITagDoAbc;

const abcFile = doAbc.abcFile;


console.log(JSON.stringify(extractD2Enums(abcFile)[0], null, 2));


process.exit();


const messageClasses = abcFile.instances.filter((c) => {
  return c.name.kind === MultinameKind.QName && c.name.ns.name.includes('dofus.network.messages');
});

const bodies = abcFile.methodBodies.filter((m) => m.method.name.includes('/serializeAs_IdentificationMessage'));
//MapComplementaryInformationsDataMessage

function filterBytecode(method: IMethodBody) {
  return method.code.filter((c) => {
    return !(c.code === InstructionCode.debug
      || c.code === InstructionCode.debugfile
      || c.code === InstructionCode.debugline);
  });
}

function instructionToString(instr: Instruction) {
  switch (instr.code) {
    case InstructionCode.getlocal:
      return `getlocal(${instr.index})`;
    case InstructionCode.setlocal:
      return `setlocal(${instr.index})`;
    case InstructionCode.getproperty:
      return `getproperty(${(instr.name as IQName).name})`;
    case InstructionCode.callpropvoid:
      return `callpropvoid(${(instr.name as IQName).name}, ${instr.argCount})`;
    case InstructionCode.findpropstrict:
      return `findpropstrict(${(instr.name as IQName).name})`;
    case InstructionCode.pushstring:
      return `pushstring("${instr.value}")`;
    case InstructionCode.pushbyte:
      return `pushbyte(${instr.byteValue})`;
    case InstructionCode.ifnlt:
      return `ifnlt(${instr.offset}) => ${instr.byteOffset + instr.offset + 4}`;
    case InstructionCode.jump:
      return `jump(${instr.operand0}) => ${instr.byteOffset + instr.operand0 + 4}`;
    case InstructionCode.iflt:
      return `iflt(${instr.operand0}) => ${instr.byteOffset + instr.operand0 + 4}`;
    case InstructionCode.iftrue:
      return `iftrue(${instr.operand0}) => ${instr.byteOffset + instr.operand0 + 4}`;
    case InstructionCode.iffalse:
      return `iffalse(${instr.operand0}) => ${instr.byteOffset + instr.operand0 + 4}`;
    case InstructionCode.getlex:
      return `getlex(${(instr.name as IQName).name})`;
    case InstructionCode.callproperty:
      return `callproperty(${(instr.name as IQName).name}, ${instr.argCount})`;
    case InstructionCode.pushdouble:
      return `pushdouble(${instr.value})`;
    case InstructionCode.contructprop:
      return `contructprop(${(instr.name as IQName).name}, ${instr.argCount})`;
    default:
      return InstructionCode[instr.code];
  }
}

function preprocessBytecode(code: Instruction[]): Instruction[] {
  return code.filter((c) => {
    return !(c.code === InstructionCode.debug
      || c.code === InstructionCode.debugfile
      || c.code === InstructionCode.debugline);
  }).map(c => {
    switch (c.code) {
    case InstructionCode.getlocal_0:
      return {
        code: InstructionCode.getlocal,
        index: 0,
        byteOffset: c.byteOffset
      } as IGetlocalInstr;
    case InstructionCode.getlocal_1:
      return {
        code: InstructionCode.getlocal,
        index: 1,
        byteOffset: c.byteOffset
      } as IGetlocalInstr;
    case InstructionCode.getlocal_2:
      return {
        code: InstructionCode.getlocal,
        index: 2,
        byteOffset: c.byteOffset
      } as IGetlocalInstr;
    case InstructionCode.getlocal_3:
      return {
        code: InstructionCode.getlocal,
        index: 3,
        byteOffset: c.byteOffset
      } as IGetlocalInstr;
    case InstructionCode.setlocal_0:
      return {
        code: InstructionCode.setlocal,
        index: 0,
        byteOffset: c.byteOffset
      } as ISetlocalInstr;
    case InstructionCode.setlocal_1:
      return {
        code: InstructionCode.setlocal,
        index: 1,
        byteOffset: c.byteOffset
      } as ISetlocalInstr;
    case InstructionCode.setlocal_2:
      return {
        code: InstructionCode.setlocal,
        index: 2,
        byteOffset: c.byteOffset
      } as ISetlocalInstr;
    case InstructionCode.setlocal_3:
      return {
        code: InstructionCode.setlocal,
        index: 3,
        byteOffset: c.byteOffset
      } as ISetlocalInstr;
    default:
      return c;
    }
  });
}



const patterns = [
  {
    label: 'function prelude',
    pattern: [
      InstructionCode.getlocal,
      InstructionCode.pushscope
    ],
    handler: () => {
      console.log('prelude')
    }
  },
  {
    label: 'precondition if-throw block',
    pattern: [
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.pushbyte,
      InstructionCode.ifnlt,
      InstructionCode.findpropstrict,
      InstructionCode.pushstring,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.add,
      InstructionCode.pushstring,
      InstructionCode.add,
      InstructionCode.contructprop,
      InstructionCode.throw
    ],
    handler: () => {}
  },
  {
    label: 'return void statement',
    pattern: [
      InstructionCode.returnvoid
    ],
    handler: () => {}
  },
  {
    label: 'simple prop',
    pattern: [
      InstructionCode.getlocal,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.callpropvoid
    ],
    handler: (instrs: [
      IGetlocal0Instr,
      IGetlocal1Instr,
      IGetpropertyInstr,
      ICallpropvoidInstr
    ]) => {
      console.log((instrs[2].name as IQName).name);
      console.log((instrs[3].name as IQName).name);
    }
  },
  {
    label: 'simple vec',
    pattern: [
      InstructionCode.getlocal,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.getproperty,
      InstructionCode.callpropvoid,
      InstructionCode.pushbyte,
      InstructionCode.convert_u,
      InstructionCode.setlocal_2,
      InstructionCode.jump,
      InstructionCode.label,
      InstructionCode.getlocal,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.callpropvoid,
      InstructionCode.getlocal,
      InstructionCode.increment,
      InstructionCode.convert_u,
      InstructionCode.setlocal_2,
      InstructionCode.getlocal,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.getproperty,
      InstructionCode.iflt
    ],
    handler: () => {}
  }
].sort((a, b) => b.pattern.length - a.pattern.length)


bodies.forEach((m) => {
  const codes = preprocessBytecode(m.code);
  console.log('=======', m.method.name, '=======');
  console.log('');
  //console.log(`${m.method.name} -> ${JSON.stringify(codes.map((c) => `${InstructionCode[c.code]}`))}`);

  //console.log(codes.map(c => InstructionCode[c.code]).join('\n'));

  let i = 0;
  while (i < codes.length) {
    const matchedPattern = patterns.
      filter(entry => entry.pattern.length <= codes.length - i).
      find(entry => {
        let match = true;
        for (let k = 0; k < entry.pattern.length; k++) {
          if (entry.pattern[k] !== codes[i + k].code) {
            match = false;
            break;
          }
        }
        return match;
      });

    if (matchedPattern) {
        const instrs = codes.slice(i, i + matchedPattern.pattern.length);
        console.log(`[${i}] ${matchedPattern.label}`);
        console.log('---------------------------');
        console.log(instrs.map(c => c.byteOffset + '\t' + instructionToString(c)).join('\n'));
        console.log('---------------------------');
        console.log('');
        //matchedPattern.handler(instrs as any);
        i += instrs.length;
    }
    else {
      console.log(`[${i}] unknown bytecode sequence`);
      console.log('---------------------------');
      console.log(codes.slice(i).map(c => c.byteOffset + '\t' + instructionToString(c)).join('\n'));
      console.log('---------------------------');
      console.log('');
      break;
    }
  }


  return;
/*
  const propvoid = codes.find((c) => c.code === InstructionCode.Op_callpropvoid) as ICallpropvoidInstr;

  const multiname = abcFile.constantPool.multinames[propvoid.operand0] as IQName;

  console.log(multiname.name, multiname.ns.name);

  const contentFunc = abcFile.methodBodies.find((mm) => mm.method.name.includes(multiname.name));

  const codes2 = filterBytecode(contentFunc);

  console.log(`${JSON.stringify(codes2.map((c) => `${InstructionCode[c.code]}`))}`);*/
});

/*
patterns := []pattern{
		{handleVecPropDynamicLen, []string{"getlocal", "increment", "convert", "setlocal", "getlocal", "pushbyte", "iflt"}},
		{handleVecTypeManagerProp, []string{"getproperty", "getlocal", "getproperty", "getlex", "astypelate", "callproperty"}},
		{handleBBWProp, []string{"getlex", "getlocal", "pushbyte", "getlocal", "getproperty", "callproperty"}},
		{handleVecScalarProp, []string{"getproperty", "getlocal", "getproperty", "callpropvoid"}},
    {handleVecPropLength, []string{"getproperty", "getproperty", "callpropvoid"}},
    {handleSimpleProp, []string{"getproperty", "callpropvoid"}},
		{handleTypeManagerProp, []string{"getproperty", "callproperty", "callpropvoid"}},
		{handleGetProperty, []string{"getproperty"}},
  }
  */

/*
public function serializeAs_ProtocolRequired(param1:ICustomDataOutput) : void
{
   if(this.requiredVersion < 0)
   {
      throw new Error("Forbidden value (" + this.requiredVersion + ") on element requiredVersion.");
   }
   param1.writeInt(this.requiredVersion);
   if(this.currentVersion < 0)
   {
      throw new Error("Forbidden value (" + this.currentVersion + ") on element currentVersion.");
   }
   param1.writeInt(this.currentVersion);
}

getlocal_0
pushscope

getlocal_0
getproperty
pushbyte
ifnlt
findpropstrict
pushstring
getlocal_0
getproperty
add
pushstring
add
contructprop
throw

getlocal_1
getlocal_0
getproperty
callpropvoid

getlocal_0
getproperty
pushbyte
ifnlt
findpropstrict
pushstring
getlocal_0
getproperty
add
pushstring
add
contructprop
throw

getlocal_1
getlocal_0
getproperty
callpropvoid

returnvoid


getlocal_0
pushscope
getlocal_0
getlocal_1
callpropvoid
getlocal_0
getlocal_1
callpropvoid
returnvoid
*/

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
