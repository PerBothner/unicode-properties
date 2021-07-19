# unicode-properties

Provides efficient lookup of a subset of Unicode properties for the
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
A client (browser or node) needs `uc-properties.js` (generated),
along with the library files `unicode-trie/index.mjs`,
`uncode-trie/swap.mjs`, and `tiny-inflate/index.mjs`.
These are all EcmaScript modules.

The file `uc-properties.js` is generated ahead-of-time using `node`;
see the `Makefile` for the needed commands.

Uses Devon Dovett's [unicode-trie](https://github.com/devongovett/unicode-trie) to compress the properties for all code points,
and [tiny-inflate](https://github.com/foliojs/tiny-inflate) to uncompress.
Also loosely based on [grapheme-breaker-mjs](https://github.com/taisukef/grapheme-breaker-mjs) and [unicode-properties](https://github.com/foliojs/unicode-properties).

