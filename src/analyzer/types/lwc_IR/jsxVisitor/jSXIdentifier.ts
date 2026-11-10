import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXIdentifier, type JSXIdentifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type JSXIdentifierFields = TypeField<'jSXIdentifier'> & {
    name: JSXIdentifier['name'];
};

export class JSXIdentifierTypeClass extends LwcCommonTypeClass<
    'jSXIdentifier',
    JSXIdentifierFields
> {
    private constructor(value: FieldsOf<JSXIdentifierFields>, sourceSpan: SourceSpan) {
        super('jSXIdentifier', value, sourceSpan);
    }

    static create(target: JSXIdentifier, originalSource: string): JSXIdentifierTypeClass {
        return new JSXIdentifierTypeClass(
            {
                name: target.name,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): JSXIdentifierFields['name'] {
        return this.getFields().name;
    }
}

export const jSXIdentifierTypePair: EvaluatePair<JSXIdentifier, JSXIdentifierTypeClass> =
    makeEvaluatePair(isJSXIdentifier, (target, originalSource) =>
        JSXIdentifierTypeClass.create(target, originalSource),
    );

export const isJSXIdentifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXIdentifierTypeClass => target instanceof JSXIdentifierTypeClass;
