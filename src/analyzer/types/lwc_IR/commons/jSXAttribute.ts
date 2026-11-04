import { isJSXAttribute, type JSXAttribute } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXAttributeTypeClass extends LwcCommonTypeClass<'jSXAttribute'> {
    private constructor(originalSource: string) {
        super('jSXAttribute', originalSource);
    }

    static create(target: JSXAttribute, originalSource: string): JSXAttributeTypeClass {
        throw new Error('JSXAttributeTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXAttributeTypePair: EvaluatePair<JSXAttribute, JSXAttributeTypeClass> =
    makeEvaluatePair(isJSXAttribute, (target, originalSource) =>
        JSXAttributeTypeClass.create(target, originalSource),
    );

export const isJSXAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is JSXAttributeTypeClass => target instanceof JSXAttributeTypeClass;
