import { isJSXNamespacedName, type JSXNamespacedName } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXNamespacedNameTypeClass extends LwcCommonTypeClass<'jSXNamespacedName'> {
    private constructor(originalSource: string) {
        super('jSXNamespacedName', originalSource);
    }

    static create(target: JSXNamespacedName, originalSource: string): JSXNamespacedNameTypeClass {
        throw new Error('JSXNamespacedNameTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXNamespacedNameTypePair: EvaluatePair<
    JSXNamespacedName,
    JSXNamespacedNameTypeClass
> = makeEvaluatePair(isJSXNamespacedName, (target, originalSource) =>
    JSXNamespacedNameTypeClass.create(target, originalSource),
);

export const isJSXNamespacedNameType = (
    target: LwcCommonTypeClass<string>,
): target is JSXNamespacedNameTypeClass => target instanceof JSXNamespacedNameTypeClass;
