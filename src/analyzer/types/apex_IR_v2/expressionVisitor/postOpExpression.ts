import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type PostOpExpressionType = TypeField<'postOpExpression'> & {
    value: BasedExpressionTypeClass;
    operator: '++' | '--';
};

export class PostOpExpressionTypeClass extends ApexCommonTypeClass<
    'postOpExpression',
    PostOpExpressionType
> {
    private constructor(fields: FieldsOf<PostOpExpressionType>, sourceSpan: SourceSpan) {
        super('postOpExpression', fields, sourceSpan);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.INC() && !ctx.DEC()) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        return new PostOpExpressionTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: ctx.INC() ? '++' : '--',
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): PostOpExpressionType['value'] {
        return this.getFields().value;
    }

    getOperator(): PostOpExpressionType['operator'] {
        return this.getFields().operator;
    }
}

export const isPostOpExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PostOpExpressionTypeClass => isSpicifyApexCommonTypeClass('postOpExpression', target);
