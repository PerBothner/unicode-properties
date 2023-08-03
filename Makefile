UNICODE_VERSION=15.0.0
NODE = node

all: out-ts/uc-properties.ts out/uc-properties.js out/unicode-trie/index.mjs out/unicode-trie/swap.mjs out/tiny-inflate/index.mjs out-ts/tiny-inflate.ts out-ts/unicode-trie.ts

out/dirs.stamp:
	mkdir -p out out/unicode-trie out/tiny-inflate out-ts
	touch out/dirs.stamp

node_modules/unicode-trie/index.js node_modules/unicode-trie/swap.js node_modules/tiny-inflate/index/js:
	npm install

out-ts/uc-properties.ts: out/dirs.stamp src/generate.js src/uc-logic.ts \
  data/GraphemeBreakProperty.txt data/emoji-data.txt data/EastAsianWidth.txt
	$(NODE) src/generate.js --typescript

out/uc-properties.js: out/dirs.stamp src/generate.js src/uc-logic.ts \
  data/GraphemeBreakProperty.txt data/emoji-data.txt data/EastAsianWidth.txt
	$(NODE) src/generate.js

out/unicode-trie/index.mjs: out/dirs.stamp node_modules/unicode-trie/index.js
	patch -o out/unicode-trie/index.mjs node_modules/unicode-trie/index.js patches/unicode-trie-index.diff

out/unicode-trie/swap.mjs: out/dirs.stamp node_modules/unicode-trie/swap.js
	patch -o out/unicode-trie/swap.mjs node_modules/unicode-trie/swap.js patches/unicode-trie-swap.diff

out/tiny-inflate/index.mjs: node_modules/tiny-inflate/index.js out/dirs.stamp out/tiny-inflate
	patch -o $@ $< patches/tiny-inflate-index.diff

out-ts/tiny-inflate.ts: out/tiny-inflate/index.mjs patches/tiny-inflate-typescript.diff
	patch -o $@ $< patches/tiny-inflate-typescript.diff

out-ts/unicode-trie.ts: out/unicode-trie/index.mjs patches/unicode-trie-typescript.diff
	patch -o $@ $< patches/unicode-trie-typescript.diff

properties.js: properties.ts strip-types.mjs
	$(NODE) strip-types.mjs properties.ts properties.js

data/GraphemeBreakProperty.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/auxiliary/GraphemeBreakProperty.txt"

data/emoji-data.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/emoji//emoji-data.txt"

data/EastAsianWidth.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/EastAsianWidth.txt"
