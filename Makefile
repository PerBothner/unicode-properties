UNICODE_VERSION=13.0.0
NODE = node

uc-properties.js: generate_data.mjs properties.mjs \
  data/GraphemeBreakProperty.txt data/emoji-data.txt data/EastAsianWidth.txt
	$(NODE) generate_data.mjs

data/GraphemeBreakProperty.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/auxiliary/GraphemeBreakProperty.txt"

data/emoji-data.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/emoji//emoji-data.txt"

data/EastAsianWidth.txt:
	mkdir -p data
	wget -O $@ "https://www.unicode.org/Public/$(UNICODE_VERSION)/ucd/EastAsianWidth.txt"
