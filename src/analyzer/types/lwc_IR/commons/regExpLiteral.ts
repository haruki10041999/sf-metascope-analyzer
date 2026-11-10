import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isRegExpLiteral, type RegExpLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';

/**
 * 正規表現のフラグ (d・g・i・m・s・u・v・y)。名前は RegExp のプロパティにそろえた。
 * u と v はどちらか一方だけ書けるので、unicode にまとめる
 */
export type RegExpFlags = {
    /** d */
    hasIndices: boolean;
    /** g */
    global: boolean;
    /** i */
    ignoreCase: boolean;
    /** m */
    multiline: boolean;
    /** s */
    dotAll: boolean;
    /** u (unicode)・v (unicodeSets)・なし (none) */
    unicode: 'none' | 'unicode' | 'unicodeSets';
    /** y */
    sticky: boolean;
};

export type RegExpLiteralFields = TypeField<'regExpLiteral'> & {
    pattern: RegExpLiteral['pattern'];
    flags: RegExpFlags;
};

const REGEXP_FLAG_NAMES = {
    d: 'hasIndices',
    g: 'global',
    i: 'ignoreCase',
    m: 'multiline',
    s: 'dotAll',
    y: 'sticky',
} as const;

const isRegExpBooleanFlag = (flag: string): flag is keyof typeof REGEXP_FLAG_NAMES =>
    Object.hasOwn(REGEXP_FLAG_NAMES, flag);

const toRegExpFlags = (target: RegExpLiteral, originalSource: string): RegExpFlags => {
    const flags: RegExpFlags = {
        hasIndices: false,
        global: false,
        ignoreCase: false,
        multiline: false,
        dotAll: false,
        unicode: 'none',
        sticky: false,
    };
    const invalid = (message: string): never =>
        failIrBuild('TYPE_MISMATCH', target, originalSource, message);
    for (const flag of target.flags) {
        if (isRegExpBooleanFlag(flag)) {
            const name = REGEXP_FLAG_NAMES[flag];
            if (flags[name]) {
                return invalid(`正規表現のフラグ ${flag} が重なっています`);
            }
            flags[name] = true;
        } else if (flag === 'u' || flag === 'v') {
            if (flags.unicode !== 'none') {
                return invalid('正規表現のフラグ u と v は、どちらか一方だけ書けます');
            }
            flags.unicode = flag === 'u' ? 'unicode' : 'unicodeSets';
        } else {
            return invalid(`正規表現のフラグ ${flag} はありません`);
        }
    }
    return flags;
};

export class RegExpLiteralTypeClass extends LwcCommonTypeClass<
    'regExpLiteral',
    RegExpLiteralFields
> {
    private constructor(value: FieldsOf<RegExpLiteralFields>, sourceSpan: SourceSpan) {
        super('regExpLiteral', value, sourceSpan);
    }

    static create(target: RegExpLiteral, originalSource: string): RegExpLiteralTypeClass {
        return new RegExpLiteralTypeClass(
            {
                pattern: target.pattern,
                flags: toRegExpFlags(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getPattern(): RegExpLiteralFields['pattern'] {
        return this.getFields().pattern;
    }

    getFlags(): RegExpLiteralFields['flags'] {
        return this.getFields().flags;
    }
}

export const regExpLiteralTypePair: EvaluatePair<RegExpLiteral, RegExpLiteralTypeClass> =
    makeEvaluatePair(isRegExpLiteral, (target, originalSource) =>
        RegExpLiteralTypeClass.create(target, originalSource),
    );

export const isRegExpLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is RegExpLiteralTypeClass => target instanceof RegExpLiteralTypeClass;
