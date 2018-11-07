function escapeRegExp(str: string) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
