import { isJSXText, type JSXText } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type JSXTextFields = {
    value: JSXText['value'];
};

export class JSXTextTypeClass extends LwcCommonTypeClass<'jSXText'> {
    private readonly value: JSXTextFields;

    private constructor(value: JSXTextFields) {
        super('jSXText');
        this.value = value;
    }

    static create(target: JSXText, originalSource: string): JSXTextTypeClass {
        return new JSXTextTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXTextFields {
        return this.value;
    }

    getValue(): JSXTextFields['value'] {
        return this.value.value;
    }
}

export const jSXTextTypePair: EvaluatePair<JSXText, JSXTextTypeClass> = makeEvaluatePair(
    isJSXText,
    (target, originalSource) => JSXTextTypeClass.create(target, originalSource),
);

export const isJSXTextType = (target: LwcCommonTypeClass<string>): target is JSXTextTypeClass =>
    target instanceof JSXTextTypeClass;
