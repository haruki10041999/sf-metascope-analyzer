import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

type EqualityOperatorType = '===' | '!==' | '==' | '!=' | '<>';

export type EqualityExpressionType = TypeField<'equalityExpression'> & {
    left: BasedExpressionTypeClass;
    operator: EqualityOperatorType;
    right: BasedExpressionTypeClass;
};

export class EqualityExpressionTypeClass extends ApexCommonTypeClass<
    'equalityExpression',
    EqualityExpressionType
> {
    private constructor(fields: FieldsOf<EqualityExpressionType>, sourceSpan: SourceSpan) {
        super('equalityExpression', fields, sourceSpan);
    }

    static create(ctx: EqualityExpressionContext): EqualityExpressionTypeClass {
        let operator: EqualityOperatorType;
        if (ctx.TRIPLEEQUAL()) {
            operator = '===';
        } else if (ctx.TRIPLENOTEQUAL()) {
            operator = '!==';
        } else if (ctx.EQUAL()) {
            operator = '==';
        } else if (ctx.NOTEQUAL()) {
            operator = '!=';
        } else if (ctx.LESSANDGREATER()) {
            operator = '<>';
        } else {
            throw new Error('値が異常です。EqualityExpressionContext: ' + ctx.getText());
        }

        return new EqualityExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: operator,
                right: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): EqualityExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): EqualityExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): EqualityExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isEqualityExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is EqualityExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('equalityExpression', target);
