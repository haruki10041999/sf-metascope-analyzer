import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class VariableDeclaratorTypeClass extends VariableTypeClass<NormalIdTypeClass | null> {
    content: ExpressionTypeClass<unknown> | null = null;

    private constructor(
        value: NormalIdTypeClass | null,
        content: ExpressionTypeClass<unknown> | null,
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('variableDeclarator', value, errorTypeClasses);
        this.content = content;
    }

    static create(ctx: VariableDeclaratorContext) {
        if (!ctx.id() || !ctx.ASSIGN() || !ctx.expression()) {
            throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
        }

        let name: NormalIdTypeClass | null = null;
        let content: ExpressionTypeClass<unknown> | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            name = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorTypeClasses['name'] = idTypeClass;
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            content = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
        }

        return new VariableDeclaratorTypeClass(name, content, errorTypeClasses);
    }

    getContent(): ExpressionTypeClass<unknown> | null {
        return this.content;
    }

    isContentNull(): boolean {
        return this.content === null;
    }
}

export const isVariableDeclaratorType = (
    target: CommonTypeClass,
): target is VariableDeclaratorTypeClass => {
    return target instanceof VariableDeclaratorTypeClass;
};
