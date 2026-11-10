import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXSpreadAttribute, type JSXSpreadAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type JSXSpreadAttributeFields = TypeField<'jSXSpreadAttribute'> & {
    argument: ExpressionTypeClass;
};

export class JSXSpreadAttributeTypeClass extends LwcCommonTypeClass<
    'jSXSpreadAttribute',
    JSXSpreadAttributeFields
> {
    private constructor(value: FieldsOf<JSXSpreadAttributeFields>, sourceSpan: SourceSpan) {
        super('jSXSpreadAttribute', value, sourceSpan);
    }

    static create(target: JSXSpreadAttribute, originalSource: string): JSXSpreadAttributeTypeClass {
        return new JSXSpreadAttributeTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): JSXSpreadAttributeFields['argument'] {
        return this.getFields().argument;
    }
}

export const jSXSpreadAttributeTypePair: EvaluatePair<
    JSXSpreadAttribute,
    JSXSpreadAttributeTypeClass
> = makeEvaluatePair(isJSXSpreadAttribute, (target, originalSource) =>
    JSXSpreadAttributeTypeClass.create(target, originalSource),
);

export const isJSXSpreadAttributeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXSpreadAttributeTypeClass => target instanceof JSXSpreadAttributeTypeClass;
