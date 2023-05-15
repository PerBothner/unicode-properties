const fs = require('fs');
//import fs from 'fs'
//import fetch from 'node-fetch'
//import { UnicodeTrieBuilder } from 'unicode-trie/builder.js'
//const UnicodeTrie = require('unicode-trie')
const UnicodeTrieBuilder = require('unicode-trie/builder.js')
//import * as UP from './properties.js'
//const UP = require('./uc-constants.js');

/*
//const s = "F2139          ; Extended_Pictographic# E0.6   [1] (ℹ️)       information"
const s = "2194..2199    ; Extended_Pictographic# E0.6   [6] (↔️..↙️)    left-right arrow..down-left arrow"
const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/
//const re = /^([0-9A-F]+)\s*;\s*([A-Za-z_]+)/
console.log(s.match(re))
process.exit(0)
*/

const main = async function() {
    const maxChar = 0x10ffff;
    const wbuffer = new Uint8Array(maxChar+1);
    let match;
    let properties_logic = fs.readFileSync('src/uc-logic.ts');
    UP = {};

    // Extract constants from uc-logic.ts
    const constant_re = /^export const ([a-zA-Z0-9_]+) = ([-0-9]+);/gm;
    match = null;
    while (match = constant_re.exec(properties_logic)) {
        const name = match[1];
        const value = parseInt(match[2], 10);
        UP[name] = value;
    }
    console.log("main started read UP:"+JSON.stringify(UP));

  // collect entries in the table into ranges to keep things smaller.
  {
    //const data = await (await fetch(url)).text()
    const path = 'data/GraphemeBreakProperty.txt';
    const data = fs.readFileSync(path, 'ascii');
    match = null
    const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm
    while (match = re.exec(data)) {
      const start = parseInt(match[1], 16);
      const end = match[2] ? parseInt(match[2], 16) : start
      const type = match[3]
      let value = -1;
      switch (type) {
      case "Prepend": value = UP.GRAPHEME_BREAK_Prepend; break;
      case "Extend": value = UP.GRAPHEME_BREAK_Extend; break;
      case "Regional_Indicator": value = UP.GRAPHEME_BREAK_Regional_Indicator; break;
      case "SpacingMark": value = UP.GRAPHEME_BREAK_SpacingMark; break;
      case "L": value = UP.GRAPHEME_BREAK_Hangul_L; break;
      case "V": value = UP.GRAPHEME_BREAK_Hangul_V; break;
      case "T": value = UP.GRAPHEME_BREAK_Hangul_T; break;
      case "LV": value = UP.GRAPHEME_BREAK_Hangul_LV; break;
      case "LVT": value = UP.GRAPHEME_BREAK_Hangul_LVT; break;
      case "ZWJ": value = UP.GRAPHEME_BREAK_ZWJ; break;
      //case "ExtPic": value = UP.GRAPHEME_BREAK_ExtPic; break;
      }
        if (value >= 0) {
          value = value << UP.GRAPHEME_BREAK_SHIFT;
          for (let i = start; i <= end; i++) {
              wbuffer[i] = value | (wbuffer[i] & ~UP.GRAPHEME_BREAK_MASK);
          }
        }
    }
  }
  {
    //const url = 'https://www.unicode.org/Public/13.0.0/ucd/emoji/emoji-data.txt' // Date: 2020-01-28, 20:52:38 GMT
    //const url = 'https://www.unicode.org/Public/UCD/latest/ucd/emoji/emoji-data.txt' // Date: 2020-01-28, 20:52:38 GMT
    const path = 'data/emoji-data.txt';
    //const data = await (await fetch(url)).text()
    const data = fs.readFileSync(path, 'ascii');
    let match = null
    const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm
    while (match = re.exec(data)) {
      const start = parseInt(match[1], 16);
      const end = match[2] ? parseInt(match[2], 16) : start
      const type = match[3]
      if (type == 'Extended_Pictographic') {
          for (let i = start; i <= end; i++) {
              let value = UP.GRAPHEME_BREAK_ExtPic << UP.GRAPHEME_BREAK_SHIFT;
              wbuffer[i] = value | (wbuffer[i] & ~UP.GRAPHEME_BREAK_MASK);
          }
      }
    }
  }
  {
      const path = 'data/EastAsianWidth.txt';
      const data = fs.readFileSync(path, 'ascii');
      let match = null;
      const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm
      while (match = re.exec(data)) {
          const start = parseInt(match[1], 16);
          const end = match[2] ? parseInt(match[2], 16) : start;
          let value = -1;
          switch (match[3]) {
          case 'W': case 'F': value = UP.CHARWIDTH_WIDE; break;
          case 'A': value = UP.CHARWIDTH_EA_AMBIGUOUS; break;
          }
          if (value >= 0) {
              let v1 = value; // FIXME
              value = value << UP.CHARWIDTH_SHIFT;
              for (let i = start; i <= end; i++) {
                  wbuffer[i] = value | (wbuffer[i] & ~UP.CHARWIDTH_MASK);
              }
          }
      }
  }
    const force_1_column = [
        0x2800, 0x28ff, // Braille
        0x2AF7,  0x2AF8,
        0x1F1E6, 0x1F1FF
    ];
    {
        let value = 1 << UP.CHARWIDTH_SHIFT;
        for (let j = 0; j < force_1_column.length; j += 2) {
            const start = force_1_column[j];
            const end = force_1_column[j+1];
            for (let i = start; i <= end; i++) {
                wbuffer[i] = value | (wbuffer[i] & ~UP.CHARWIDTH_MASK);
            }
        }
    }

    const trie = new UnicodeTrieBuilder(0);
    for (let i = 0; i <= maxChar; i++) {
        let value = wbuffer[i];
        if (value !== 0) {
            let start = i;
            while (i < maxChar && wbuffer[i+1] == value)
                i++;
            trie.setRange(start, i, value);
        }
  }
  let emit_typescript = process.argv.length >= 2 && process.argv[2] === "--typescript";
    let outJs = `\
import UnicodeTrie from './unicode-trie/index.mjs';
const trieRaw = ${JSON.stringify(trie.toBuffer().toString('base64'))};
let _data = null;
{
  const bin = window.atob(trieRaw);
  _data = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++)
    _data[i] = bin.charCodeAt(i);
}
const trieData = new UnicodeTrie(_data);
${properties_logic}`;
//    let outJs = 'const trieRaw = ' + JSON.stringify(trie.toBuffer().toString('base64')) + ';';
    //    outJs += fs.readFileSync('./properties.js', 'ascii');
    if (! emit_typescript) // strip type specifiers
        outJs = outJs.replaceAll(/([)a-zA-Z]): [a-z]+/g, "$1")
        .replaceAll(/ as number/g, "");
    fs.writeFileSync(emit_typescript ? 'out-ts/uc-properties.ts' : 'out/uc-properties.js', outJs);
}

main()
