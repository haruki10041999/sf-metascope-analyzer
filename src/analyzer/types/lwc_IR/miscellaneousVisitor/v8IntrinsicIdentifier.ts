import { isV8IntrinsicIdentifier, type V8IntrinsicIdentifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type V8IntrinsicIdentifierFields = {
    name: V8IntrinsicIdentifier['name'];
};

export class V8IntrinsicIdentifierTypeClass extends LwcCommonTypeClass<'v8IntrinsicIdentifier'> {
    private readonly value: V8IntrinsicIdentifierFields;

    private constructor(value: V8IntrinsicIdentifierFields) {
        super('v8IntrinsicIdentifier');
        this.value = value;
    }

    static create(
        target: V8IntrinsicIdentifier,
        originalSource: string,
    ): V8IntrinsicIdentifierTypeClass {
        return new V8IntrinsicIdentifierTypeClass({
            name: target.name,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): V8IntrinsicIdentifierFields {
        return this.value;
    }

    getName(): V8IntrinsicIdentifierFields['name'] {
        return this.value.name;
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
