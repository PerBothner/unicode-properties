# unicode-properties

Provides efficient lookup of a subset of Unicode properties,
with a focus on properties useful for terminals, such as the
[DomTerm terminal emulator](https://domterm.org).
Specifically, the following are encoded in a compact table:

* Properties needed for determining extended grapheme clusters.

* Determination of double-width characters (EastAsianWidth).

* Determination of special characters that should be forced to single-width
even though they may not be available in standard monospace fonts.
Specifically, this applies to Braille characters, which are
sometimes used for graphics.

You can support more properties (as long as they can be encoded
in a 32-bit integer).
Just add them to  `properties.mjs` and enhance `generate_data.mjs` as needed.

The file `properties.mjs` defines the API.
A client (browser or node) needs `out/uc-properties.js` (generated),
along with the library files `out/unicode-trie/index.mjs`,
`out/unicode-trie/swap.mjs`, and `out/tiny-inflate/index.mjs`.
These are all EcmaScript modules.

The file `uc-properties.js` is generated ahead-of-time using `node`;
see the `Makefile` for the needed commands.

You can also get TypeScript versions: Use `out-ts/uc-properties.ts`,
along with `out-ts/unicode-trie.ts` and `out-ts/tiny-inflate.ts`.

To change Unicode version, edit `UNICODE_VERSION` in `Makefile`, and remove all of `data/*.txt`.

Uses Devon Govett's [unicode-trie](https://github.com/devongovett/unicode-trie) to compress the properties for all code points,
and [tiny-inflate](https://github.com/foliojs/tiny-inflate) to uncompress.
Also partly based on [grapheme-breaker-mjs](https://github.com/taisukef/grapheme-breaker-mjs) and [unicode-properties](https://github.com/foliojs/unicode-properties).
