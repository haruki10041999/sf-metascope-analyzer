import { isRegExpLiteral, type RegExpLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class RegExpLiteralTypeClass extends LwcCommonTypeClass<'regExpLiteral'> {
    private constructor(originalSource: string) {
        super('regExpLiteral', originalSource);
    }

    static create(target: RegExpLiteral, originalSource: string): RegExpLiteralTypeClass {
        throw new Error('RegExpLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const regExpLiteralTypePair: EvaluatePair<RegExpLiteral, RegExpLiteralTypeClass> =
    makeEvaluatePair(isRegExpLiteral, (target, originalSource) =>
        RegExpLiteralTypeClass.create(target, originalSource),
    );

export const isRegExpLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is RegExpLiteralTypeClass => target instanceof RegExpLiteralTypeClass;
