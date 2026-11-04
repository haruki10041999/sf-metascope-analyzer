import { isRestElement, type RestElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class RestElementTypeClass extends LwcCommonTypeClass<'restElement'> {
    private constructor(originalSource: string) {
        super('restElement', originalSource);
    }

    static create(target: RestElement, originalSource: string): RestElementTypeClass {
        throw new Error('RestElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const restElementTypePair: EvaluatePair<RestElement, RestElementTypeClass> =
    makeEvaluatePair(isRestElement, (target, originalSource) =>
        RestElementTypeClass.create(target, originalSource),
    );

export const isRestElementType = (
    target: LwcCommonTypeClass<string>,
): target is RestElementTypeClass => target instanceof RestElementTypeClass;
