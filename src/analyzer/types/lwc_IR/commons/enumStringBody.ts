import { isEnumStringBody, type EnumStringBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumStringBodyTypeClass extends LwcCommonTypeClass<'enumStringBody'> {
    private constructor(originalSource: string) {
        super('enumStringBody', originalSource);
    }

    static create(target: EnumStringBody, originalSource: string): EnumStringBodyTypeClass {
        throw new Error('EnumStringBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumStringBodyTypePair: EvaluatePair<EnumStringBody, EnumStringBodyTypeClass> =
    makeEvaluatePair(isEnumStringBody, (target, originalSource) =>
        EnumStringBodyTypeClass.create(target, originalSource),
    );

export const isEnumStringBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumStringBodyTypeClass => target instanceof EnumStringBodyTypeClass;
