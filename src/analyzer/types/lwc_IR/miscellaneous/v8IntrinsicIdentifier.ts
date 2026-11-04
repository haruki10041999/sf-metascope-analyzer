import { isV8IntrinsicIdentifier, type V8IntrinsicIdentifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class V8IntrinsicIdentifierTypeClass extends LwcCommonTypeClass<'v8IntrinsicIdentifier'> {
    private constructor(originalSource: string) {
        super('v8IntrinsicIdentifier', originalSource);
    }

    static create(
        target: V8IntrinsicIdentifier,
        originalSource: string,
    ): V8IntrinsicIdentifierTypeClass {
        throw new Error('V8IntrinsicIdentifierTypeClass.create is not implemented: ' + target.type);
    }
}

export const v8IntrinsicIdentifierTypePair: EvaluatePair<
    V8IntrinsicIdentifier,
    V8IntrinsicIdentifierTypeClass
> = makeEvaluatePair(isV8IntrinsicIdentifier, (target, originalSource) =>
    V8IntrinsicIdentifierTypeClass.create(target, originalSource),
);

export const isV8IntrinsicIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is V8IntrinsicIdentifierTypeClass => target instanceof V8IntrinsicIdentifierTypeClass;
