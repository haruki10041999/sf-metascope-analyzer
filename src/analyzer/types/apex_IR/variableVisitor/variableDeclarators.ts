import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass, VariableVisitor, isVariableDeclaratorType, isVariableTypeAll } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class VariableDeclaratorsTypeClass extends VariableTypeClass {
    private constructor(
        value: VariableTypeClass[],
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('variableDeclarators', value, errorTypeClasses);
    }

    static create(ctx: VariableDeclaratorsContext) {
        if (!ctx.variableDeclarator_list() || ctx.variableDeclarator_list().length === 0) {
            throw new Error('値が異常です。VariableDeclaratorsContext: ' + ctx.getText());
        }

        const value: VariableTypeClass[] = [];
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        ctx.variableDeclarator_list().map((variableDeclaratorCtx, index) => {
            const variableTypeClass = new VariableVisitor().visit(variableDeclaratorCtx);
            if (isVariableTypeAll(variableTypeClass)) {
                value.push(variableTypeClass);
            } else {
                errorTypeClasses[`value_${index}`] = variableTypeClass;
            }
        });

        return new VariableDeclaratorsTypeClass(value, errorTypeClasses);
    }
}

export const isVariableDeclaratorsType = (
    value: VariableTypeClass,
): value is VariableDeclaratorsTypeClass => {
    return value instanceof VariableDeclaratorsTypeClass;
};
