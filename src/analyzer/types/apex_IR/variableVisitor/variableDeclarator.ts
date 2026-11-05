import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class VariableDeclaratorTypeClass extends VariableTypeClass<
    'variableDeclarator',
    NormalIdTypeClass
> {
    private content: BasedExpressionTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        content: BasedExpressionTypeClass | ApexErrorTypeClass | null,
    ) {
        super('variableDeclarator', value);
        this.content = content;
    }

    static create(ctx: VariableDeclaratorContext) {
        if (!ctx.id()) {
            throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
        }

        return new VariableDeclaratorTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            // 初期化子は任意（`String name;`）
            visitOptionalNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }

    getContent(): BasedExpressionTypeClass | ApexErrorTypeClass | null {
        return this.content;
    }
}

export const isVariableDeclaratorType = (
    target: ApexCommonTypeClass<string>,
): target is VariableDeclaratorTypeClass => {
    return target instanceof VariableDeclaratorTypeClass;
};
