import {readFileSync} from 'node:fs';

// Source-text comparisons only. Never use this for binary/hash evidence.
// CRLF and LF are equivalent; bare CR, BOM, whitespace and all code stay exact.
export function sourceText(text){
  if(typeof text!=='string')throw new TypeError('Source text must be a string');
  return text.replace(/\r\n/g,'\n');
}
export function readSourceText(file){
  return sourceText(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(readFileSync(file)));
}
