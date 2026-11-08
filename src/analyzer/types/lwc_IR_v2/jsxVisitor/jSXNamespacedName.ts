import { isJSXNamespacedName, type JSXNamespacedName } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { jSXIdentifierTypePair, type JSXIdentifierTypeClass } from './jSXIdentifier';

const jSXNamespacedNameNamespacePairs = lazyPairs(() => [jSXIdentifierTypePair] as const);
const jSXNamespacedNameNamePairs = lazyPairs(() => [jSXIdentifierTypePair] as const);

export type JSXNamespacedNameFields = {
    namespace: JSXIdentifierTypeClass | LwcErrorTypeClass;
    name: JSXIdentifierTypeClass | LwcErrorTypeClass;
};

export class JSXNamespacedNameTypeClass extends LwcCommonTypeClass<'jSXNamespacedName'> {
    private readonly value: JSXNamespacedNameFields;

    private constructor(value: JSXNamespacedNameFields) {
        super('jSXNamespacedName');
        this.value = value;
    }

    static create(target: JSXNamespacedName, originalSource: string): JSXNamespacedNameTypeClass {
        return new JSXNamespacedNameTypeClass({
            namespace: visitNode(
                target.namespace,
                originalSource,
                jSXNamespacedNameNamespacePairs(),
                'JSXNamespacedName.namespace',
            ),
            name: visitNode(
                target.name,
                originalSource,
                jSXNamespacedNameNamePairs(),
                'JSXNamespacedName.name',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXNamespacedNameFields {
        return this.value;
    }

    getNamespace(): JSXNamespacedNameFields['namespace'] {
        return this.value.namespace;
    }

    getName(): JSXNamespacedNameFields['name'] {
        return this.value.name;
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
