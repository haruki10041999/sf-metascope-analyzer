import { isJSXIdentifier, type JSXIdentifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXIdentifierTypeClass extends LwcCommonTypeClass<'jSXIdentifier'> {
    private constructor(originalSource: string) {
        super('jSXIdentifier', originalSource);
    }

    static create(target: JSXIdentifier, originalSource: string): JSXIdentifierTypeClass {
        throw new Error('JSXIdentifierTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXIdentifierTypePair: EvaluatePair<JSXIdentifier, JSXIdentifierTypeClass> =
    makeEvaluatePair(isJSXIdentifier, (target, originalSource) =>
        JSXIdentifierTypeClass.create(target, originalSource),
    );

export const isJSXIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is JSXIdentifierTypeClass => target instanceof JSXIdentifierTypeClass;
