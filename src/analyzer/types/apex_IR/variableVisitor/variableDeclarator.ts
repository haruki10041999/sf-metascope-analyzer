import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class VariableDeclaratorTypeClass extends VariableTypeClass<NormalIdTypeClass> {
    content: ExpressionAllTypeClass | ErrorTypeClass;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        content: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('variableDeclarator', value);
        this.content = content;
    }

    static create(ctx: VariableDeclaratorContext) {
        if (!ctx.id() || !ctx.ASSIGN() || !ctx.expression()) {
            throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
        }

        return new VariableDeclaratorTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }

    getContent(): ExpressionAllTypeClass | ErrorTypeClass {
        return this.content;
    }
}

export const isVariableDeclaratorType = (
    target: CommonTypeClass,
): target is VariableDeclaratorTypeClass => {
    return target instanceof VariableDeclaratorTypeClass;
};
