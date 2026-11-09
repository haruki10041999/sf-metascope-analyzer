import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isV8IntrinsicIdentifier, type V8IntrinsicIdentifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type V8IntrinsicIdentifierFields = TypeField<'v8IntrinsicIdentifier'> & {
    name: V8IntrinsicIdentifier['name'];
};

export class V8IntrinsicIdentifierTypeClass extends LwcCommonTypeClass<
    'v8IntrinsicIdentifier',
    V8IntrinsicIdentifierFields
> {
    private constructor(value: FieldsOf<V8IntrinsicIdentifierFields>, sourceSpan: SourceSpan) {
        super('v8IntrinsicIdentifier', value, sourceSpan);
    }

    static create(
        target: V8IntrinsicIdentifier,
        originalSource: string,
    ): V8IntrinsicIdentifierTypeClass {
        return new V8IntrinsicIdentifierTypeClass(
            {
                name: target.name,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): V8IntrinsicIdentifierFields['name'] {
        return this.getFields().name;
    }
}

export const v8IntrinsicIdentifierTypePair: EvaluatePair<
    V8IntrinsicIdentifier,
    V8IntrinsicIdentifierTypeClass
> = makeEvaluatePair(isV8IntrinsicIdentifier, (target, originalSource) =>
    V8IntrinsicIdentifierTypeClass.create(target, originalSource),
);

export const isV8IntrinsicIdentifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is V8IntrinsicIdentifierTypeClass => target instanceof V8IntrinsicIdentifierTypeClass;
