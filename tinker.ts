import { SwfReader } from 'xswf';
import { IQName, MultinameKind } from 'xswf/dist/abcFile/types/multiname';
import { ITraitSlot, TraitKind } from 'xswf/dist/abcFile/types/trait';
import { ITagDoAbc, TagCode } from 'xswf/dist/Types';

const reader = new SwfReader('./tests/DofusInvoker.swf');

const file = reader.getFile();

const doAbc = file.tags.find((tag) => tag.code === TagCode.DoABC) as ITagDoAbc;

const abcFile = doAbc.abcFile;

const messageClasses = abcFile.instances.filter((c) => {
  return c.name.kind === MultinameKind.QName && c.name.ns.name.includes('dofus.network.messages');
});

const messages = messageClasses.map((messageClass) => {
  const name: IQName = messageClass.name as IQName;
  const protocolIdTrait = messageClass.class.traits.find((trait) => {
    return trait.kind === TraitKind.Const
      && trait.name.kind === MultinameKind.QName
      && trait.name.name === 'protocolId';
  }) as ITraitSlot;
  const protocolId: number = protocolIdTrait.value.val as number;
  return { id: protocolId, name: name.name };
});

const orderedMessages = messages.sort((a, b) => a.id - b.id);

const toLog = orderedMessages.map((m) => `${m.id}: ${m.name}`);

// tslint:disable-next-line:no-console
console.log(JSON.stringify(toLog, null, 2));
