import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXText, type JSXText } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type JSXTextFields = TypeField<'jSXText'> & {
    value: JSXText['value'];
};

export class JSXTextTypeClass extends LwcCommonTypeClass<'jSXText', JSXTextFields> {
    private constructor(value: FieldsOf<JSXTextFields>, sourceSpan: SourceSpan) {
        super('jSXText', value, sourceSpan);
    }

    static create(target: JSXText, originalSource: string): JSXTextTypeClass {
        return new JSXTextTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): JSXTextFields['value'] {
        return this.getFields().value;
    }
}

export const jSXTextTypePair: EvaluatePair<JSXText, JSXTextTypeClass> = makeEvaluatePair(
    isJSXText,
    (target, originalSource) => JSXTextTypeClass.create(target, originalSource),
);

export const isJSXTextType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXTextTypeClass => target instanceof JSXTextTypeClass;
