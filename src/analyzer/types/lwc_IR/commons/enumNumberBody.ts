import { isEnumNumberBody, type EnumNumberBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumNumberBodyTypeClass extends LwcCommonTypeClass<'enumNumberBody'> {
    private constructor(originalSource: string) {
        super('enumNumberBody', originalSource);
    }

    static create(target: EnumNumberBody, originalSource: string): EnumNumberBodyTypeClass {
        throw new Error('EnumNumberBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumNumberBodyTypePair: EvaluatePair<EnumNumberBody, EnumNumberBodyTypeClass> =
    makeEvaluatePair(isEnumNumberBody, (target, originalSource) =>
        EnumNumberBodyTypeClass.create(target, originalSource),
    );

export const isEnumNumberBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumNumberBodyTypeClass => target instanceof EnumNumberBodyTypeClass;
