import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { IdTypeClass, IdVisitor, isIdType } from '../idVisitor';
import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class VariableDeclaratorTypeClass extends VariableTypeClass {
    name: any | null = null;

    private constructor(
        name: IdTypeClass | null,
        value: ExpressionTypeClass | null,
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('variableDeclarator', value, errorTypeClasses);
        this.name = name;
    }

    static create(ctx: VariableDeclaratorContext) {
        if (!ctx.id() || !ctx.ASSIGN() || !ctx.expression()) {
            throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
        }

        let name: IdTypeClass | null = null;
        let value: ExpressionTypeClass | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        if (isIdType(idTypeClass)) {
            name = idTypeClass;
        } else {
            errorTypeClasses['name'] = idTypeClass;
        }

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
        }

        return new VariableDeclaratorTypeClass(name, value, errorTypeClasses);
    }

    getName(): any | null {
        return this.name;
    }

    isNameNull(): boolean {
        return this.name === null;
    }
}

export const isVariableDeclaratorType = (
    target: CommonTypeClass,
): target is VariableDeclaratorTypeClass => {
    return target instanceof VariableDeclaratorTypeClass;
};
