import { isTSExternalModuleReference, type TSExternalModuleReference } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSExternalModuleReferenceTypeClass extends LwcCommonTypeClass<'tSExternalModuleReference'> {
    private constructor(originalSource: string) {
        super('tSExternalModuleReference', originalSource);
    }

    static create(
        target: TSExternalModuleReference,
        originalSource: string,
    ): TSExternalModuleReferenceTypeClass {
        throw new Error(
            'TSExternalModuleReferenceTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSExternalModuleReferenceTypePair: EvaluatePair<
    TSExternalModuleReference,
    TSExternalModuleReferenceTypeClass
> = makeEvaluatePair(isTSExternalModuleReference, (target, originalSource) =>
    TSExternalModuleReferenceTypeClass.create(target, originalSource),
);

export const isTSExternalModuleReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TSExternalModuleReferenceTypeClass =>
    target instanceof TSExternalModuleReferenceTypeClass;
