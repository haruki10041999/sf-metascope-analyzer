import { isJSXIdentifier, type JSXIdentifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type JSXIdentifierFields = {
    name: JSXIdentifier['name'];
};

export class JSXIdentifierTypeClass extends LwcCommonTypeClass<'jSXIdentifier'> {
    private readonly value: JSXIdentifierFields;

    private constructor(value: JSXIdentifierFields) {
        super('jSXIdentifier');
        this.value = value;
    }

    static create(target: JSXIdentifier, originalSource: string): JSXIdentifierTypeClass {
        return new JSXIdentifierTypeClass({
            name: target.name,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXIdentifierFields {
        return this.value;
    }

    getName(): JSXIdentifierFields['name'] {
        return this.value.name;
    }
}

export const jSXIdentifierTypePair: EvaluatePair<JSXIdentifier, JSXIdentifierTypeClass> =
    makeEvaluatePair(isJSXIdentifier, (target, originalSource) =>
        JSXIdentifierTypeClass.create(target, originalSource),
    );

export const isJSXIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is JSXIdentifierTypeClass => target instanceof JSXIdentifierTypeClass;
