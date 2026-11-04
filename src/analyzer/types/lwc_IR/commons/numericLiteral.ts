import { isNumericLiteral, type NumericLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NumericLiteralTypeClass extends LwcCommonTypeClass<'numericLiteral'> {
    private constructor(originalSource: string) {
        super('numericLiteral', originalSource);
    }

    static create(target: NumericLiteral, originalSource: string): NumericLiteralTypeClass {
        throw new Error('NumericLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const numericLiteralTypePair: EvaluatePair<NumericLiteral, NumericLiteralTypeClass> =
    makeEvaluatePair(isNumericLiteral, (target, originalSource) =>
        NumericLiteralTypeClass.create(target, originalSource),
    );

export const isNumericLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NumericLiteralTypeClass => target instanceof NumericLiteralTypeClass;
