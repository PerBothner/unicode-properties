const GRAPHEME_BREAK_MASK = 0xF;
const GRAPHEME_BREAK_SHIFT = 0;
const CHARWIDTH_MASK = 0x30;
const CHARWIDTH_SHIFT = 4;

// Values for the GRAPHEME_BREAK property
const GRAPHEME_BREAK_Other = 0; // includes CR, LF, Control
const GRAPHEME_BREAK_Prepend = 1;
const GRAPHEME_BREAK_Extend = 2;
const GRAPHEME_BREAK_Regional_Indicator = 3;
const GRAPHEME_BREAK_SpacingMark = 4;
const GRAPHEME_BREAK_Hangul_L = 5;
const GRAPHEME_BREAK_Hangul_V = 6;
const GRAPHEME_BREAK_Hangul_T = 7;
const GRAPHEME_BREAK_Hangul_LV = 8;
const GRAPHEME_BREAK_Hangul_LVT = 9;
const GRAPHEME_BREAK_ZWJ = 10;
const GRAPHEME_BREAK_ExtPic = 11;

// Only used as return value from shouldJoin/shouldJoinBackwards.
// (Must be positive; distinct from other values;
// and become GRAPHEME_BREAK_Other when masked with GRAPHEME_BREAK_MASK.)
const GRAPHEME_BREAK_SAW_Regional_Pair = 32;

const CHARWIDTH_NORMAL = 0;
const CHARWIDTH_FORCE_1COLUMN = 1;
const CHARWIDTH_EA_AMBIGUOUS = 2;
const CHARWIDTH_WIDE = 3;

// In the following 'info' is an encoded value from trie.get(codePoint)

function infoToWidthInfo(info) {
    return (info & CHARWIDTH_MASK) >> CHARWIDTH_SHIFT;
}

function infoToWidth(info, ambiguousIsWide = false) {
    const v = infoToWidthInfo(info);
    return v < CHARWIDTH_EA_AMBIGUOUS ? 1
        : v >= CHARWIDTH_WIDE || ambiguousIsWide ? 2 : 1;
}

function strWidth(str, preferWide) {
    let width = 0;
    for (let i = 0; i < str.length;) {
        const codePoint = str.codePointAt(i);
        width += infoToWidth(getInfo(codePoint), preferWide);
        i += (codePoint <= 0xffff) ? 1 : 2;
    }
    return width;
}

function columnToIndexInContext(str, startIndex, column, preferWide) {
    let rv = 0;
    for (let i = startIndex; ;) {
	if (i >= str.length)
	    return i;
	const codePoint = str.codePointAt(i);
	const w = infoToWidth(getInfo(codePoint), preferWide);
	rv += w;
	if (rv > column)
	    return i;
	i += (codePoint <= 0xffff) ? 1 : 2;
    }
}


// Test if should break between beforeState and afterCode.
// Return <= 0 if should break; > 0 if should join.
// 'beforeState' is  the return value from the previous possible break;
// the value 0 is start of string.
// 'afterCode' is the GRAPHEME_BREAK_Xxx value for the following codepoint.
function shouldJoin(beforeState, afterInfo) {
    let beforeCode = (beforeState & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    let afterCode = (afterInfo & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    if (_shouldJoin(beforeCode, afterCode)) {
        if (afterCode === GRAPHEME_BREAK_Regional_Indicator)
            return GRAPHEME_BREAK_SAW_Regional_Pair;
        else
            return afterCode + 16;
    } else
        return afterCode - 16;
}

function shouldJoinBackwards(beforeInfo, afterState) {
    let afterCode = (afterState & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    let beforeCode = (beforeInfo & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    if (_shouldJoin(beforeCode, afterCode)) {
        if (beforeCode === GRAPHEME_BREAK_Regional_Indicator)
            return GRAPHEME_BREAK_SAW_Regional_Pair;
        else
            return beforeCode + 16;
    } else
        return beforeCode - 16;
}

/** Doesn't handle an odd number of RI characters. */
function _shouldJoin(beforeCode, afterCode) {
    if (beforeCode >= GRAPHEME_BREAK_Hangul_L
        && beforeCode <= GRAPHEME_BREAK_Hangul_LVT) {
        if (beforeCode == GRAPHEME_BREAK_Hangul_L // GB6
            && (afterCode == GRAPHEME_BREAK_Hangul_L
                || afterCode == GRAPHEME_BREAK_Hangul_V
                || afterCode == GRAPHEME_BREAK_Hangul_LV
                || afterCode == GRAPHEME_BREAK_Hangul_LVT))
            return true;
        if ((beforeCode == GRAPHEME_BREAK_Hangul_LV // GB7
             || beforeCode == GRAPHEME_BREAK_Hangul_V)
            && (afterCode == GRAPHEME_BREAK_Hangul_V
                || afterCode == GRAPHEME_BREAK_Hangul_T))
            return true;
        if ((beforeCode == GRAPHEME_BREAK_Hangul_LVT // GB8
             || beforeCode == GRAPHEME_BREAK_Hangul_T)
            && afterCode == GRAPHEME_BREAK_Hangul_T)
            return true;
    }
    if (afterCode == GRAPHEME_BREAK_Extend // GB9
        || afterCode == GRAPHEME_BREAK_ZWJ
        || afterCode == GRAPHEME_BREAK_SpacingMark) // GB9b
        return true;
    if (beforeCode == GRAPHEME_BREAK_ZWJ // GB11
        && afterCode == GRAPHEME_BREAK_ExtPic)
        return true;
    if (afterCode == GRAPHEME_BREAK_Regional_Indicator // GB12, GB13
        && beforeCode == GRAPHEME_BREAK_Regional_Indicator)
        return true;
    return false;
}

const getInfo = typeof trieData === "undefined" ? undefined
      : (codePoint) => { return trieData.get(codePoint);};

export { 
    GRAPHEME_BREAK_MASK,
    GRAPHEME_BREAK_SHIFT,
    GRAPHEME_BREAK_Other,
    GRAPHEME_BREAK_Prepend,
    GRAPHEME_BREAK_Extend,
    GRAPHEME_BREAK_Regional_Indicator,
    GRAPHEME_BREAK_SpacingMark,
    GRAPHEME_BREAK_Hangul_L,
    GRAPHEME_BREAK_Hangul_V,
    GRAPHEME_BREAK_Hangul_T,
    GRAPHEME_BREAK_Hangul_LV,
    GRAPHEME_BREAK_Hangul_LVT,
    GRAPHEME_BREAK_ZWJ,
    GRAPHEME_BREAK_ExtPic,
    GRAPHEME_BREAK_SAW_Regional_Pair,
    CHARWIDTH_MASK,
    CHARWIDTH_SHIFT,
    CHARWIDTH_NORMAL,
    CHARWIDTH_FORCE_1COLUMN,
    CHARWIDTH_EA_AMBIGUOUS,
    CHARWIDTH_WIDE,
    infoToWidthInfo,
    infoToWidth,
    shouldJoin,
    shouldJoinBackwards,
    getInfo,
    strWidth,
    columnToIndexInContext
};
