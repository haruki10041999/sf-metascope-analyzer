import { isStringLiteral, type StringLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class StringLiteralTypeClass extends LwcCommonTypeClass<'stringLiteral'> {
    private constructor(originalSource: string) {
        super('stringLiteral', originalSource);
    }

    static create(target: StringLiteral, originalSource: string): StringLiteralTypeClass {
        throw new Error('StringLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const stringLiteralTypePair: EvaluatePair<StringLiteral, StringLiteralTypeClass> =
    makeEvaluatePair(isStringLiteral, (target, originalSource) =>
        StringLiteralTypeClass.create(target, originalSource),
    );

export const isStringLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is StringLiteralTypeClass => target instanceof StringLiteralTypeClass;
