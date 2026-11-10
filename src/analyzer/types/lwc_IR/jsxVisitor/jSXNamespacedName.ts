import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXNamespacedName, type JSXNamespacedName } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { JSXIdentifierTypeClass } from './jSXIdentifier';

export type JSXNamespacedNameFields = TypeField<'jSXNamespacedName'> & {
    namespace: JSXIdentifierTypeClass;
    name: JSXIdentifierTypeClass;
};

export class JSXNamespacedNameTypeClass extends LwcCommonTypeClass<
    'jSXNamespacedName',
    JSXNamespacedNameFields
> {
    private constructor(value: FieldsOf<JSXNamespacedNameFields>, sourceSpan: SourceSpan) {
        super('jSXNamespacedName', value, sourceSpan);
    }

    static create(target: JSXNamespacedName, originalSource: string): JSXNamespacedNameTypeClass {
        return new JSXNamespacedNameTypeClass(
            {
                namespace: JSXIdentifierTypeClass.create(target.namespace, originalSource),
                name: JSXIdentifierTypeClass.create(target.name, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getNamespace(): JSXNamespacedNameFields['namespace'] {
        return this.getFields().namespace;
    }

    getName(): JSXNamespacedNameFields['name'] {
        return this.getFields().name;
    }
}

export const jSXNamespacedNameTypePair: EvaluatePair<
    JSXNamespacedName,
    JSXNamespacedNameTypeClass
> = makeEvaluatePair(isJSXNamespacedName, (target, originalSource) =>
    JSXNamespacedNameTypeClass.create(target, originalSource),
);

export const isJSXNamespacedNameType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXNamespacedNameTypeClass => target instanceof JSXNamespacedNameTypeClass;
