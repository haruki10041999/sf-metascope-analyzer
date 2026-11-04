import { isEnumBooleanBody, type EnumBooleanBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumBooleanBodyTypeClass extends LwcCommonTypeClass<'enumBooleanBody'> {
    private constructor(originalSource: string) {
        super('enumBooleanBody', originalSource);
    }

    static create(target: EnumBooleanBody, originalSource: string): EnumBooleanBodyTypeClass {
        throw new Error('EnumBooleanBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumBooleanBodyTypePair: EvaluatePair<EnumBooleanBody, EnumBooleanBodyTypeClass> =
    makeEvaluatePair(isEnumBooleanBody, (target, originalSource) =>
        EnumBooleanBodyTypeClass.create(target, originalSource),
    );

export const isEnumBooleanBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumBooleanBodyTypeClass => target instanceof EnumBooleanBodyTypeClass;
