import { isEnumSymbolBody, type EnumSymbolBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumSymbolBodyTypeClass extends LwcCommonTypeClass<'enumSymbolBody'> {
    private constructor(originalSource: string) {
        super('enumSymbolBody', originalSource);
    }

    static create(target: EnumSymbolBody, originalSource: string): EnumSymbolBodyTypeClass {
        throw new Error('EnumSymbolBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumSymbolBodyTypePair: EvaluatePair<EnumSymbolBody, EnumSymbolBodyTypeClass> =
    makeEvaluatePair(isEnumSymbolBody, (target, originalSource) =>
        EnumSymbolBodyTypeClass.create(target, originalSource),
    );

export const isEnumSymbolBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumSymbolBodyTypeClass => target instanceof EnumSymbolBodyTypeClass;
