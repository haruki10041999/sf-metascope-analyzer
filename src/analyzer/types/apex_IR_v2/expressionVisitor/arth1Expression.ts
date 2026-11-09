import { Arth1ExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type Arth1ExpressionType = TypeField<'arth1Expression'> & {
    left: BasedExpressionTypeClass;
    operator: '*' | '/';
    right: BasedExpressionTypeClass;
};

export class Arth1ExpressionTypeClass extends ApexCommonTypeClass<
    'arth1Expression',
    Arth1ExpressionType
> {
    private constructor(fields: FieldsOf<Arth1ExpressionType>, sourceSpan: SourceSpan) {
        super('arth1Expression', fields, sourceSpan);
    }

    static create(ctx: Arth1ExpressionContext): Arth1ExpressionTypeClass {
        if (!ctx.MUL() && !ctx.DIV()) {
            throw new Error('値が異常です。Arth1ExpressionContext: ' + ctx.getText());
        }

        return new Arth1ExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: ctx.MUL() ? '*' : '/',
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

    getLeft(): Arth1ExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): Arth1ExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): Arth1ExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isArth1ExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is Arth1ExpressionTypeClass => isSpicifyApexCommonTypeClass('arth1Expression', target);
