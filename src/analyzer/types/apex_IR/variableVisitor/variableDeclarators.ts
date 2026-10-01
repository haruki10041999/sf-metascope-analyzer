import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import {
    VariableDeclaratorTypeClass,
    VariableTypeClass,
    VariableVisitor,
    isVariableDeclaratorType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class VariableDeclaratorsTypeClass extends VariableTypeClass<VariableDeclaratorTypeClass[]> {
    private constructor(
        value: VariableDeclaratorTypeClass[],
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('variableDeclarators', value, errorTypeClasses);
    }

    static create(ctx: VariableDeclaratorsContext) {
        if (!ctx.variableDeclarator_list() || ctx.variableDeclarator_list().length === 0) {
            throw new Error('値が異常です。VariableDeclaratorsContext: ' + ctx.getText());
        }

        const value: VariableDeclaratorTypeClass[] = [];
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        ctx.variableDeclarator_list().map((variableDeclaratorCtx, index) => {
            const variableTypeClass = new VariableVisitor().visit(variableDeclaratorCtx);
            if (isVariableDeclaratorType(variableTypeClass)) {
                value.push(variableTypeClass);
            } else if (isErrorType(variableTypeClass)) {
                errorTypeClasses[`value_${index}`] = variableTypeClass;
            }
        });

        return new VariableDeclaratorsTypeClass(value, errorTypeClasses);
    }
}

export const isVariableDeclaratorsType = (
    value: VariableTypeClass<unknown>,
): value is VariableDeclaratorsTypeClass => {
    return value instanceof VariableDeclaratorsTypeClass;
};
