import { isJSXSpreadAttribute, type JSXSpreadAttribute } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXSpreadAttributeTypeClass extends LwcCommonTypeClass<'jSXSpreadAttribute'> {
    private constructor(originalSource: string) {
        super('jSXSpreadAttribute', originalSource);
    }

    static create(target: JSXSpreadAttribute, originalSource: string): JSXSpreadAttributeTypeClass {
        throw new Error('JSXSpreadAttributeTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXSpreadAttributeTypePair: EvaluatePair<
    JSXSpreadAttribute,
    JSXSpreadAttributeTypeClass
> = makeEvaluatePair(isJSXSpreadAttribute, (target, originalSource) =>
    JSXSpreadAttributeTypeClass.create(target, originalSource),
);

export const isJSXSpreadAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is JSXSpreadAttributeTypeClass => target instanceof JSXSpreadAttributeTypeClass;
