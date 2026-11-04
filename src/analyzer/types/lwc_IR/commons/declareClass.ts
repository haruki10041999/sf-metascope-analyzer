import { isDeclareClass, type DeclareClass } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareClassTypeClass extends LwcCommonTypeClass<'declareClass'> {
    private constructor(originalSource: string) {
        super('declareClass', originalSource);
    }

    static create(target: DeclareClass, originalSource: string): DeclareClassTypeClass {
        throw new Error('DeclareClassTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareClassTypePair: EvaluatePair<DeclareClass, DeclareClassTypeClass> =
    makeEvaluatePair(isDeclareClass, (target, originalSource) =>
        DeclareClassTypeClass.create(target, originalSource),
    );

export const isDeclareClassType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareClassTypeClass => target instanceof DeclareClassTypeClass;
