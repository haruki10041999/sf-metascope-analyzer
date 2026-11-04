import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { TSAnyKeywordTypeClass, tSAnyKeywordTypePair } from '../commons/tSAnyKeyword';
import { TSBooleanKeywordTypeClass, tSBooleanKeywordTypePair } from '../commons/tSBooleanKeyword';
import { TSBigIntKeywordTypeClass, tSBigIntKeywordTypePair } from '../commons/tSBigIntKeyword';
import {
    TSIntrinsicKeywordTypeClass,
    tSIntrinsicKeywordTypePair,
} from '../commons/tSIntrinsicKeyword';
import { TSNeverKeywordTypeClass, tSNeverKeywordTypePair } from '../commons/tSNeverKeyword';
import { TSNullKeywordTypeClass, tSNullKeywordTypePair } from '../commons/tSNullKeyword';
import { TSNumberKeywordTypeClass, tSNumberKeywordTypePair } from '../commons/tSNumberKeyword';
import { TSObjectKeywordTypeClass, tSObjectKeywordTypePair } from '../commons/tSObjectKeyword';
import { TSStringKeywordTypeClass, tSStringKeywordTypePair } from '../commons/tSStringKeyword';
import { TSSymbolKeywordTypeClass, tSSymbolKeywordTypePair } from '../commons/tSSymbolKeyword';
import {
    TSUndefinedKeywordTypeClass,
    tSUndefinedKeywordTypePair,
} from '../commons/tSUndefinedKeyword';
import { TSUnknownKeywordTypeClass, tSUnknownKeywordTypePair } from '../commons/tSUnknownKeyword';
import { TSVoidKeywordTypeClass, tSVoidKeywordTypePair } from '../commons/tSVoidKeyword';
import { TSThisTypeTypeClass, tSThisTypeTypePair } from '../commons/tSThisType';
import {
    TSTemplateLiteralTypeTypeClass,
    tSTemplateLiteralTypeTypePair,
} from '../commons/tSTemplateLiteralType';
import { TSLiteralTypeTypeClass, tSLiteralTypeTypePair } from '../commons/tSLiteralType';

export {
    TSAnyKeywordTypeClass,
    tSAnyKeywordTypePair,
    isTSAnyKeywordType,
} from '../commons/tSAnyKeyword';
export {
    TSBooleanKeywordTypeClass,
    tSBooleanKeywordTypePair,
    isTSBooleanKeywordType,
} from '../commons/tSBooleanKeyword';
export {
    TSBigIntKeywordTypeClass,
    tSBigIntKeywordTypePair,
    isTSBigIntKeywordType,
} from '../commons/tSBigIntKeyword';
export {
    TSIntrinsicKeywordTypeClass,
    tSIntrinsicKeywordTypePair,
    isTSIntrinsicKeywordType,
} from '../commons/tSIntrinsicKeyword';
export {
    TSNeverKeywordTypeClass,
    tSNeverKeywordTypePair,
    isTSNeverKeywordType,
} from '../commons/tSNeverKeyword';
export {
    TSNullKeywordTypeClass,
    tSNullKeywordTypePair,
    isTSNullKeywordType,
} from '../commons/tSNullKeyword';
export {
    TSNumberKeywordTypeClass,
    tSNumberKeywordTypePair,
    isTSNumberKeywordType,
} from '../commons/tSNumberKeyword';
export {
    TSObjectKeywordTypeClass,
    tSObjectKeywordTypePair,
    isTSObjectKeywordType,
} from '../commons/tSObjectKeyword';
export {
    TSStringKeywordTypeClass,
    tSStringKeywordTypePair,
    isTSStringKeywordType,
} from '../commons/tSStringKeyword';
export {
    TSSymbolKeywordTypeClass,
    tSSymbolKeywordTypePair,
    isTSSymbolKeywordType,
} from '../commons/tSSymbolKeyword';
export {
    TSUndefinedKeywordTypeClass,
    tSUndefinedKeywordTypePair,
    isTSUndefinedKeywordType,
} from '../commons/tSUndefinedKeyword';
export {
    TSUnknownKeywordTypeClass,
    tSUnknownKeywordTypePair,
    isTSUnknownKeywordType,
} from '../commons/tSUnknownKeyword';
export {
    TSVoidKeywordTypeClass,
    tSVoidKeywordTypePair,
    isTSVoidKeywordType,
} from '../commons/tSVoidKeyword';
export { TSThisTypeTypeClass, tSThisTypeTypePair, isTSThisTypeType } from '../commons/tSThisType';
export {
    TSTemplateLiteralTypeTypeClass,
    tSTemplateLiteralTypeTypePair,
    isTSTemplateLiteralTypeType,
} from '../commons/tSTemplateLiteralType';
export {
    TSLiteralTypeTypeClass,
    tSLiteralTypeTypePair,
    isTSLiteralTypeType,
} from '../commons/tSLiteralType';

const tSBaseTypeVisitorEvaluatePairs = [
    tSAnyKeywordTypePair,
    tSBooleanKeywordTypePair,
    tSBigIntKeywordTypePair,
    tSIntrinsicKeywordTypePair,
    tSNeverKeywordTypePair,
    tSNullKeywordTypePair,
    tSNumberKeywordTypePair,
    tSObjectKeywordTypePair,
    tSStringKeywordTypePair,
    tSSymbolKeywordTypePair,
    tSUndefinedKeywordTypePair,
    tSUnknownKeywordTypePair,
    tSVoidKeywordTypePair,
    tSThisTypeTypePair,
    tSTemplateLiteralTypeTypePair,
    tSLiteralTypeTypePair,
] as const;

export class TSBaseTypeVisitor extends LwcCommonVisitor<
    (typeof tSBaseTypeVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = tSBaseTypeVisitorEvaluatePairs;
}

export type TSBaseTypeTypeClass =
    | TSAnyKeywordTypeClass
    | TSBooleanKeywordTypeClass
    | TSBigIntKeywordTypeClass
    | TSIntrinsicKeywordTypeClass
    | TSNeverKeywordTypeClass
    | TSNullKeywordTypeClass
    | TSNumberKeywordTypeClass
    | TSObjectKeywordTypeClass
    | TSStringKeywordTypeClass
    | TSSymbolKeywordTypeClass
    | TSUndefinedKeywordTypeClass
    | TSUnknownKeywordTypeClass
    | TSVoidKeywordTypeClass
    | TSThisTypeTypeClass
    | TSTemplateLiteralTypeTypeClass
    | TSLiteralTypeTypeClass;

export const isTSBaseTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSBaseTypeTypeClass => {
    return (
        target instanceof TSAnyKeywordTypeClass ||
        target instanceof TSBooleanKeywordTypeClass ||
        target instanceof TSBigIntKeywordTypeClass ||
        target instanceof TSIntrinsicKeywordTypeClass ||
        target instanceof TSNeverKeywordTypeClass ||
        target instanceof TSNullKeywordTypeClass ||
        target instanceof TSNumberKeywordTypeClass ||
        target instanceof TSObjectKeywordTypeClass ||
        target instanceof TSStringKeywordTypeClass ||
        target instanceof TSSymbolKeywordTypeClass ||
        target instanceof TSUndefinedKeywordTypeClass ||
        target instanceof TSUnknownKeywordTypeClass ||
        target instanceof TSVoidKeywordTypeClass ||
        target instanceof TSThisTypeTypeClass ||
        target instanceof TSTemplateLiteralTypeTypeClass ||
        target instanceof TSLiteralTypeTypeClass
    );
};
