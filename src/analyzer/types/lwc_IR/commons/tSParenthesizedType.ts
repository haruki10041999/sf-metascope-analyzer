import { isTSParenthesizedType, type TSParenthesizedType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSParenthesizedTypeTypeClass extends LwcCommonTypeClass<'tSParenthesizedType'> {
    private constructor(originalSource: string) {
        super('tSParenthesizedType', originalSource);
    }

    static create(
        target: TSParenthesizedType,
        originalSource: string,
    ): TSParenthesizedTypeTypeClass {
        throw new Error('TSParenthesizedTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSParenthesizedTypeTypePair: EvaluatePair<
    TSParenthesizedType,
    TSParenthesizedTypeTypeClass
> = makeEvaluatePair(isTSParenthesizedType, (target, originalSource) =>
    TSParenthesizedTypeTypeClass.create(target, originalSource),
);

export const isTSParenthesizedTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSParenthesizedTypeTypeClass => target instanceof TSParenthesizedTypeTypeClass;
