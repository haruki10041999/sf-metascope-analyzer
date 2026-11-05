import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { StringLiteralTypeClass, stringLiteralTypePair } from '../commons/stringLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from '../commons/numericLiteral';
import { NullLiteralTypeClass, nullLiteralTypePair } from '../commons/nullLiteral';
import { BooleanLiteralTypeClass, booleanLiteralTypePair } from '../commons/booleanLiteral';
import { RegExpLiteralTypeClass, regExpLiteralTypePair } from '../commons/regExpLiteral';
import { TemplateLiteralTypeClass, templateLiteralTypePair } from '../commons/templateLiteral';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from '../commons/bigIntLiteral';

export {
    StringLiteralTypeClass,
    stringLiteralTypePair,
    isStringLiteralType,
} from '../commons/stringLiteral';
export {
    NumericLiteralTypeClass,
    numericLiteralTypePair,
    isNumericLiteralType,
} from '../commons/numericLiteral';
export {
    NullLiteralTypeClass,
    nullLiteralTypePair,
    isNullLiteralType,
} from '../commons/nullLiteral';
export {
    BooleanLiteralTypeClass,
    booleanLiteralTypePair,
    isBooleanLiteralType,
} from '../commons/booleanLiteral';
export {
    RegExpLiteralTypeClass,
    regExpLiteralTypePair,
    isRegExpLiteralType,
} from '../commons/regExpLiteral';
export {
    TemplateLiteralTypeClass,
    templateLiteralTypePair,
    isTemplateLiteralType,
} from '../commons/templateLiteral';
export {
    BigIntLiteralTypeClass,
    bigIntLiteralTypePair,
    isBigIntLiteralType,
} from '../commons/bigIntLiteral';

export const literalVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            stringLiteralTypePair,
            numericLiteralTypePair,
            nullLiteralTypePair,
            booleanLiteralTypePair,
            regExpLiteralTypePair,
            templateLiteralTypePair,
            bigIntLiteralTypePair,
        ] as const,
);

export class LiteralVisitor extends LwcCommonVisitor<
    ReturnType<typeof literalVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return literalVisitorEvaluatePairs();
    }
}

export type LiteralTypeClass =
    | StringLiteralTypeClass
    | NumericLiteralTypeClass
    | NullLiteralTypeClass
    | BooleanLiteralTypeClass
    | RegExpLiteralTypeClass
    | TemplateLiteralTypeClass
    | BigIntLiteralTypeClass;

export const isLiteralType = (target: LwcCommonTypeClass<string>): target is LiteralTypeClass => {
    return (
        target instanceof StringLiteralTypeClass ||
        target instanceof NumericLiteralTypeClass ||
        target instanceof NullLiteralTypeClass ||
        target instanceof BooleanLiteralTypeClass ||
        target instanceof RegExpLiteralTypeClass ||
        target instanceof TemplateLiteralTypeClass ||
        target instanceof BigIntLiteralTypeClass
    );
};
