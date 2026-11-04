import { isIndexedAccessType, type IndexedAccessType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class IndexedAccessTypeTypeClass extends LwcCommonTypeClass<'indexedAccessType'> {
    private constructor(originalSource: string) {
        super('indexedAccessType', originalSource);
    }

    static create(target: IndexedAccessType, originalSource: string): IndexedAccessTypeTypeClass {
        throw new Error('IndexedAccessTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const indexedAccessTypeTypePair: EvaluatePair<
    IndexedAccessType,
    IndexedAccessTypeTypeClass
> = makeEvaluatePair(isIndexedAccessType, (target, originalSource) =>
    IndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is IndexedAccessTypeTypeClass => target instanceof IndexedAccessTypeTypeClass;
