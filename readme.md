# unicode-properties

Provides efficient lookup of a subset of Unicode properties for the
[DomTerm terminal emulator](https://domterm.org) terminal emulator.
Specifically, the following are encoded in a compact table:

* Properties needed for determining extended grapheme clusters.

* Determination of double-width characters (EastAsianWidth).

* Determination of special characters that should be force to single-width
even though they may not be available in stndard monospace fonts.
Specifically, this applies to Braille characters, which are
sometimes used for graphics.

More properties could be easily supported as long as they can fit in a 32-bit integer - see `generate_data.mjs`.

Uses [unicode-trie](https://github.com/devongovett/unicode-trie) to compress
the properties for all code points.
Also loosely based on [grapheme-breaker-mjs](https://github.com/taisukef/grapheme-breaker-mjs) and [Devon Dovett's unicode-properties]((https://github.com/foliojs/unicode-properties).

