import { isTemplateLiteral, type TemplateLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TemplateLiteralTypeClass extends LwcCommonTypeClass<'templateLiteral'> {
    private constructor(originalSource: string) {
        super('templateLiteral', originalSource);
    }

    static create(target: TemplateLiteral, originalSource: string): TemplateLiteralTypeClass {
        throw new Error('TemplateLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const templateLiteralTypePair: EvaluatePair<TemplateLiteral, TemplateLiteralTypeClass> =
    makeEvaluatePair(isTemplateLiteral, (target, originalSource) =>
        TemplateLiteralTypeClass.create(target, originalSource),
    );

export const isTemplateLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is TemplateLiteralTypeClass => target instanceof TemplateLiteralTypeClass;
