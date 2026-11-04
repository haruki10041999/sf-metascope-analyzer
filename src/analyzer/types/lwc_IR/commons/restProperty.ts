import { isRestProperty, type Node, type RestProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

const isRestPropertyNode = (target: Node | null | undefined): target is RestProperty =>
    isRestProperty(target);

export class RestPropertyTypeClass extends LwcCommonTypeClass<'restProperty'> {
    private constructor(originalSource: string) {
        super('restProperty', originalSource);
    }

    static create(target: RestProperty, originalSource: string): RestPropertyTypeClass {
        throw new Error('RestPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const restPropertyTypePair: EvaluatePair<RestProperty, RestPropertyTypeClass> =
    makeEvaluatePair(isRestPropertyNode, (target, originalSource) =>
        RestPropertyTypeClass.create(target, originalSource),
    );

export const isRestPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is RestPropertyTypeClass => target instanceof RestPropertyTypeClass;
