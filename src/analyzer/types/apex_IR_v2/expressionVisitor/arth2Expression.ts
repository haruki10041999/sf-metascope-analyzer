import { Arth2ExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type Arth2ExpressionType = TypeField<'arth2Expression'> & {
    left: BasedExpressionTypeClass;
    operator: '+' | '-';
    right: BasedExpressionTypeClass;
};

export class Arth2ExpressionTypeClass extends ApexCommonTypeClass<
    'arth2Expression',
    Arth2ExpressionType
> {
    private constructor(fields: FieldsOf<Arth2ExpressionType>, sourceSpan: SourceSpan) {
        super('arth2Expression', fields, sourceSpan);
    }

    static create(ctx: Arth2ExpressionContext): Arth2ExpressionTypeClass {
        if (!ctx.ADD() && !ctx.SUB()) {
            throw new Error('値が異常です。Arth2ExpressionContext: ' + ctx.getText());
        }

        return new Arth2ExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: ctx.ADD() ? '+' : '-',
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

    getLeft(): Arth2ExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): Arth2ExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): Arth2ExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isArth2ExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is Arth2ExpressionTypeClass => isSpicifyApexCommonTypeClass('arth2Expression', target);
