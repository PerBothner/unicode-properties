export const GRAPHEME_BREAK_MASK = 0xF;
export const GRAPHEME_BREAK_SHIFT = 0;
export const CHARWIDTH_MASK = 0x30;
export const CHARWIDTH_SHIFT = 4;
export const INCB_MASK = 0xC0;
export const INCB_SHIFT = 6;

// Values for the GRAPHEME_BREAK property
export const GRAPHEME_BREAK_Other = 0; // includes CR, LF, Control
export const GRAPHEME_BREAK_Prepend = 1;
export const GRAPHEME_BREAK_Extend = 2;
export const GRAPHEME_BREAK_Regional_Indicator = 3;
export const GRAPHEME_BREAK_SpacingMark = 4;
export const GRAPHEME_BREAK_Hangul_L = 5;
export const GRAPHEME_BREAK_Hangul_V = 6;
export const GRAPHEME_BREAK_Hangul_T = 7;
export const GRAPHEME_BREAK_Hangul_LV = 8;
export const GRAPHEME_BREAK_Hangul_LVT = 9;
export const GRAPHEME_BREAK_ZWJ = 10;
export const GRAPHEME_BREAK_ExtPic = 11;

// Only used as return value from shouldJoin/shouldJoinBackwards.
// (Must be positive; distinct from other values;
// and become GRAPHEME_BREAK_Other when masked with GRAPHEME_BREAK_MASK.)
export const GRAPHEME_BREAK_SAW_Regional_Pair = 32;

// Only used in the state returned from shouldJoin, to remember that an
// Extend or ZWJ was preceded by ExtPic Extend*, as rule GB11 requires.
// (Must be distinct from the GRAPHEME_BREAK_Xxx values above
// and fit in GRAPHEME_BREAK_MASK.)
export const GRAPHEME_BREAK_ExtPic_Extend = 12;
export const GRAPHEME_BREAK_ExtPic_ZWJ = 13;

// Only used in the state returned from shouldJoin/shouldJoinBackwards,
// for rule GB9c. GRAPHEME_BREAK_InCB_Linker is an InCB=Linker followed by
// zero or more InCB=Extend; GRAPHEME_BREAK_InCB_Consonant is an InCB=Consonant
// (which always has Grapheme_Cluster_Break=Other).
// (Must be distinct from the GRAPHEME_BREAK_Xxx values above
// and fit in GRAPHEME_BREAK_MASK.)
export const GRAPHEME_BREAK_InCB_Linker = 14;
export const GRAPHEME_BREAK_InCB_Consonant = 15;

// Values for the Indic_Conjunct_Break (InCB) property
export const INCB_None = 0;
export const INCB_Linker = 1;
export const INCB_Extend = 2;
export const INCB_Consonant = 3;

export const CHARWIDTH_NORMAL = 0;
export const CHARWIDTH_FORCE_1COLUMN = 1;
export const CHARWIDTH_EA_AMBIGUOUS = 2;
export const CHARWIDTH_WIDE = 3;

// In the following 'info' is an encoded value from trie.get(codePoint)

// In the following 'info' is an encoded value from trie.get(codePoint)

export function infoToWidthInfo(info: number): number {
    return (info & CHARWIDTH_MASK) >> CHARWIDTH_SHIFT;
}

export function infoToWidth(info: number, ambiguousIsWide = false): number {
    const v = infoToWidthInfo(info);
    return v < CHARWIDTH_EA_AMBIGUOUS ? 1
        : v >= CHARWIDTH_WIDE || ambiguousIsWide ? 2 : 1;
}

export function strWidth(str: string, preferWide: boolean): number {
    let width = 0;
    for (let i = 0; i < str.length;) {
        const codePoint = str.codePointAt(i) as number;
        width += infoToWidth(getInfo(codePoint), preferWide);
        i += (codePoint <= 0xffff) ? 1 : 2;
    }
    return width;
}

export function columnToIndexInContext(str: string, startIndex: number, column: number, preferWide: boolean): number {
    let rv = 0;
    for (let i = startIndex; ;) {
	if (i >= str.length)
	    return i;
	const codePoint = str.codePointAt(i) as number;
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
export function shouldJoin(beforeState: number, afterInfo: number): number {
    let beforeCode = (beforeState & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    let afterCode = infoToCode(afterInfo);
    let afterInCB = (afterInfo & INCB_MASK) >> INCB_SHIFT;
    if (_shouldJoin(beforeCode, afterCode)) {
        if (afterCode === GRAPHEME_BREAK_Regional_Indicator)
            return GRAPHEME_BREAK_SAW_Regional_Pair;
        if (beforeCode === GRAPHEME_BREAK_ExtPic
            || beforeCode === GRAPHEME_BREAK_ExtPic_Extend) {
            if (afterCode === GRAPHEME_BREAK_Extend)
                return GRAPHEME_BREAK_ExtPic_Extend + 16;
            if (afterCode === GRAPHEME_BREAK_ZWJ)
                return GRAPHEME_BREAK_ExtPic_ZWJ + 16;
        }
        if (afterInCB === INCB_Linker
            || (afterInCB === INCB_Extend
                && beforeCode === GRAPHEME_BREAK_InCB_Linker))
            return GRAPHEME_BREAK_InCB_Linker + 16;
        return afterCode + 16;
    } else if (afterInCB === INCB_Linker)
        return GRAPHEME_BREAK_InCB_Linker - 16;
    else
        return afterCode - 16;
}

export function shouldJoinBackwards(beforeInfo: number, afterState: number): number {
    let afterCode = (afterState & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
    let beforeCode = infoToCode(beforeInfo);
    let beforeInCB = (beforeInfo & INCB_MASK) >> INCB_SHIFT;
    // Looking backwards we can't see what precedes a ZWJ,
    // so assume the ExtPic Extend* that GB11 requires.
    // Nor can we see if an InCB=Extend follows an InCB=Linker,
    // so GB9c only joins an InCB=Linker directly before an InCB=Consonant.
    if (_shouldJoin(beforeCode === GRAPHEME_BREAK_ZWJ ? GRAPHEME_BREAK_ExtPic_ZWJ
                    : beforeInCB === INCB_Linker ? GRAPHEME_BREAK_InCB_Linker
                    : beforeCode,
                    afterCode)) {
        if (beforeCode === GRAPHEME_BREAK_Regional_Indicator)
            return GRAPHEME_BREAK_SAW_Regional_Pair;
        else
            return beforeCode + 16;
    } else
        return beforeCode - 16;
}

// The GRAPHEME_BREAK_Xxx value of a code point, except that an
// InCB=Consonant is GRAPHEME_BREAK_InCB_Consonant (for rule GB9c).
function infoToCode(info: number): number {
    if ((info & INCB_MASK) >> INCB_SHIFT === INCB_Consonant)
        return GRAPHEME_BREAK_InCB_Consonant;
    return (info & GRAPHEME_BREAK_MASK) >> GRAPHEME_BREAK_SHIFT;
}

/** Doesn't handle an odd number of RI characters. */
function _shouldJoin(beforeCode: number, afterCode: number): boolean {
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
        || beforeCode == GRAPHEME_BREAK_Prepend // GB9a
        || afterCode == GRAPHEME_BREAK_SpacingMark) // GB9b
        return true;
    if (beforeCode == GRAPHEME_BREAK_InCB_Linker // GB9c
        && afterCode == GRAPHEME_BREAK_InCB_Consonant)
        return true;
    if (beforeCode == GRAPHEME_BREAK_ExtPic_ZWJ // GB11
        && afterCode == GRAPHEME_BREAK_ExtPic)
        return true;
    if (afterCode == GRAPHEME_BREAK_Regional_Indicator // GB12, GB13
        && beforeCode == GRAPHEME_BREAK_Regional_Indicator)
        return true;
    return false;
}

export function getInfo(codePoint: number): number {
    return trieData.get(codePoint);
}
