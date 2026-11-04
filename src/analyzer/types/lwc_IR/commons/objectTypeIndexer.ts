import { isObjectTypeIndexer, type ObjectTypeIndexer } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypeIndexerTypeClass extends LwcCommonTypeClass<'objectTypeIndexer'> {
    private constructor(originalSource: string) {
        super('objectTypeIndexer', originalSource);
    }

    static create(target: ObjectTypeIndexer, originalSource: string): ObjectTypeIndexerTypeClass {
        throw new Error('ObjectTypeIndexerTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectTypeIndexerTypePair: EvaluatePair<
    ObjectTypeIndexer,
    ObjectTypeIndexerTypeClass
> = makeEvaluatePair(isObjectTypeIndexer, (target, originalSource) =>
    ObjectTypeIndexerTypeClass.create(target, originalSource),
);

export const isObjectTypeIndexerType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeIndexerTypeClass => target instanceof ObjectTypeIndexerTypeClass;
