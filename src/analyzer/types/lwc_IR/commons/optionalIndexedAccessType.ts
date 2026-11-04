import { isOptionalIndexedAccessType, type OptionalIndexedAccessType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class OptionalIndexedAccessTypeTypeClass extends LwcCommonTypeClass<'optionalIndexedAccessType'> {
    private constructor(originalSource: string) {
        super('optionalIndexedAccessType', originalSource);
    }

    static create(
        target: OptionalIndexedAccessType,
        originalSource: string,
    ): OptionalIndexedAccessTypeTypeClass {
        throw new Error(
            'OptionalIndexedAccessTypeTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const optionalIndexedAccessTypeTypePair: EvaluatePair<
    OptionalIndexedAccessType,
    OptionalIndexedAccessTypeTypeClass
> = makeEvaluatePair(isOptionalIndexedAccessType, (target, originalSource) =>
    OptionalIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isOptionalIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalIndexedAccessTypeTypeClass =>
    target instanceof OptionalIndexedAccessTypeTypeClass;
