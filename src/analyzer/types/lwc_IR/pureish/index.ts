import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
} from '../commons/functionDeclaration';
import {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
} from '../commons/functionExpression';
import { StringLiteralTypeClass, stringLiteralTypePair } from '../commons/stringLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from '../commons/numericLiteral';
import { NullLiteralTypeClass, nullLiteralTypePair } from '../commons/nullLiteral';
import { BooleanLiteralTypeClass, booleanLiteralTypePair } from '../commons/booleanLiteral';
import { RegExpLiteralTypeClass, regExpLiteralTypePair } from '../commons/regExpLiteral';
import {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
} from '../commons/arrowFunctionExpression';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from '../commons/bigIntLiteral';

export {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
    isFunctionDeclarationType,
} from '../commons/functionDeclaration';
export {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
    isFunctionExpressionType,
} from '../commons/functionExpression';
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
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
    isArrowFunctionExpressionType,
} from '../commons/arrowFunctionExpression';
export {
    BigIntLiteralTypeClass,
    bigIntLiteralTypePair,
    isBigIntLiteralType,
} from '../commons/bigIntLiteral';

const pureishVisitorEvaluatePairs = [
    functionDeclarationTypePair,
    functionExpressionTypePair,
    stringLiteralTypePair,
    numericLiteralTypePair,
    nullLiteralTypePair,
    booleanLiteralTypePair,
    regExpLiteralTypePair,
    arrowFunctionExpressionTypePair,
    bigIntLiteralTypePair,
] as const;

export class PureishVisitor extends LwcCommonVisitor<(typeof pureishVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = pureishVisitorEvaluatePairs;
}

export type PureishTypeClass =
    | FunctionDeclarationTypeClass
    | FunctionExpressionTypeClass
    | StringLiteralTypeClass
    | NumericLiteralTypeClass
    | NullLiteralTypeClass
    | BooleanLiteralTypeClass
    | RegExpLiteralTypeClass
    | ArrowFunctionExpressionTypeClass
    | BigIntLiteralTypeClass;

export const isPureishType = (target: LwcCommonTypeClass<string>): target is PureishTypeClass => {
    return (
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof StringLiteralTypeClass ||
        target instanceof NumericLiteralTypeClass ||
        target instanceof NullLiteralTypeClass ||
        target instanceof BooleanLiteralTypeClass ||
        target instanceof RegExpLiteralTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof BigIntLiteralTypeClass
    );
};
