import { isJSXSpreadAttribute, type JSXSpreadAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type JSXSpreadAttributeFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass;
};

export class JSXSpreadAttributeTypeClass extends LwcCommonTypeClass<'jSXSpreadAttribute'> {
    private readonly value: JSXSpreadAttributeFields;

    private constructor(value: JSXSpreadAttributeFields) {
        super('jSXSpreadAttribute');
        this.value = value;
    }

    static create(target: JSXSpreadAttribute, originalSource: string): JSXSpreadAttributeTypeClass {
        return new JSXSpreadAttributeTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXSpreadAttributeFields {
        return this.value;
    }

    getArgument(): JSXSpreadAttributeFields['argument'] {
        return this.value.argument;
    }
}

export const jSXSpreadAttributeTypePair: EvaluatePair<
    JSXSpreadAttribute,
    JSXSpreadAttributeTypeClass
> = makeEvaluatePair(isJSXSpreadAttribute, (target, originalSource) =>
    JSXSpreadAttributeTypeClass.create(target, originalSource),
);

export const isJSXSpreadAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is JSXSpreadAttributeTypeClass => target instanceof JSXSpreadAttributeTypeClass;
