import { isRegexLiteral, type Node, type RegexLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

const isRegexLiteralNode = (target: Node | null | undefined): target is RegexLiteral =>
    isRegexLiteral(target);

export class RegexLiteralTypeClass extends LwcCommonTypeClass<'regexLiteral'> {
    private constructor(originalSource: string) {
        super('regexLiteral', originalSource);
    }

    static create(target: RegexLiteral, originalSource: string): RegexLiteralTypeClass {
        throw new Error('RegexLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const regexLiteralTypePair: EvaluatePair<RegexLiteral, RegexLiteralTypeClass> =
    makeEvaluatePair(isRegexLiteralNode, (target, originalSource) =>
        RegexLiteralTypeClass.create(target, originalSource),
    );

export const isRegexLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is RegexLiteralTypeClass => target instanceof RegexLiteralTypeClass;
