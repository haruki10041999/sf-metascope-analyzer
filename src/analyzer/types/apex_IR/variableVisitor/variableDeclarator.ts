import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class VariableDeclaratorTypeClass extends VariableTypeClass<NormalIdTypeClass> {
    private content: BasedExpressionTypeClass | ErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        content: BasedExpressionTypeClass | ErrorTypeClass | null,
    ) {
        super('variableDeclarator', value);
        this.content = content;
    }

    static create(ctx: VariableDeclaratorContext) {
        if (!ctx.id()) {
            throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
        }

        return new VariableDeclaratorTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            // 初期化子は任意（`String name;`）
            ctx.expression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.expression()),
                      isBasedExpressionTypeClass,
                      'expression',
                  )
                : null,
        );
    }

    getContent(): BasedExpressionTypeClass | ErrorTypeClass | null {
        return this.content;
    }
}

export const isVariableDeclaratorType = (
    target: CommonTypeClass,
): target is VariableDeclaratorTypeClass => {
    return target instanceof VariableDeclaratorTypeClass;
};
