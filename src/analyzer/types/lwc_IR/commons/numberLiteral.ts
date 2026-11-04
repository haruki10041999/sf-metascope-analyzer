import { isNumberLiteral, type Node, type NumberLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

const isNumberLiteralNode = (target: Node | null | undefined): target is NumberLiteral =>
    isNumberLiteral(target);

export class NumberLiteralTypeClass extends LwcCommonTypeClass<'numberLiteral'> {
    private constructor(originalSource: string) {
        super('numberLiteral', originalSource);
    }

    static create(target: NumberLiteral, originalSource: string): NumberLiteralTypeClass {
        throw new Error('NumberLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const numberLiteralTypePair: EvaluatePair<NumberLiteral, NumberLiteralTypeClass> =
    makeEvaluatePair(isNumberLiteralNode, (target, originalSource) =>
        NumberLiteralTypeClass.create(target, originalSource),
    );

export const isNumberLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NumberLiteralTypeClass => target instanceof NumberLiteralTypeClass;
