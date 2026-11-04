import { isObjectMethod, type ObjectMethod } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectMethodTypeClass extends LwcCommonTypeClass<'objectMethod'> {
    private constructor(originalSource: string) {
        super('objectMethod', originalSource);
    }

    static create(target: ObjectMethod, originalSource: string): ObjectMethodTypeClass {
        throw new Error('ObjectMethodTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectMethodTypePair: EvaluatePair<ObjectMethod, ObjectMethodTypeClass> =
    makeEvaluatePair(isObjectMethod, (target, originalSource) =>
        ObjectMethodTypeClass.create(target, originalSource),
    );

export const isObjectMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectMethodTypeClass => target instanceof ObjectMethodTypeClass;
