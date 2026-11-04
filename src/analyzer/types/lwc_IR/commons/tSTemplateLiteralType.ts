import { isTSTemplateLiteralType, type TSTemplateLiteralType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTemplateLiteralTypeTypeClass extends LwcCommonTypeClass<'tSTemplateLiteralType'> {
    private constructor(originalSource: string) {
        super('tSTemplateLiteralType', originalSource);
    }

    static create(
        target: TSTemplateLiteralType,
        originalSource: string,
    ): TSTemplateLiteralTypeTypeClass {
        throw new Error('TSTemplateLiteralTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTemplateLiteralTypeTypePair: EvaluatePair<
    TSTemplateLiteralType,
    TSTemplateLiteralTypeTypeClass
> = makeEvaluatePair(isTSTemplateLiteralType, (target, originalSource) =>
    TSTemplateLiteralTypeTypeClass.create(target, originalSource),
);

export const isTSTemplateLiteralTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSTemplateLiteralTypeTypeClass => target instanceof TSTemplateLiteralTypeTypeClass;
