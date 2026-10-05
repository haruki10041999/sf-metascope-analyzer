import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import {
    VariableDeclaratorTypeClass,
    VariableListTypeClass,
    VariableVisitor,
    isVariableDeclaratorType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class VariableDeclaratorsTypeClass extends VariableListTypeClass<VariableDeclaratorTypeClass> {
    private constructor(value: (VariableDeclaratorTypeClass | ErrorTypeClass)[]) {
        super('variableDeclarators', value);
    }

    static create(ctx: VariableDeclaratorsContext) {
        if (!ctx.variableDeclarator_list() || ctx.variableDeclarator_list().length === 0) {
            throw new Error('値が異常です。VariableDeclaratorsContext: ' + ctx.getText());
        }

        return new VariableDeclaratorsTypeClass(
            isValidClassList(
                ctx.variableDeclarator_list(),
                (ctx) => new VariableVisitor().visit(ctx),
                isVariableDeclaratorType,
                'variableDeclarator',
            ),
        );
    }
}

export const isVariableDeclaratorsType = (
    value: CommonTypeClass,
): value is VariableDeclaratorsTypeClass => {
    return value instanceof VariableDeclaratorsTypeClass;
};
