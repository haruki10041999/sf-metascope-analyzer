import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import {
    VariableDeclaratorTypeClass,
    VariableListTypeClass,
    VariableVisitor,
    isVariableDeclaratorType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class VariableDeclaratorsTypeClass extends VariableListTypeClass<
    'variableDeclarators',
    VariableDeclaratorTypeClass
> {
    private constructor(value: (VariableDeclaratorTypeClass | ApexErrorTypeClass)[]) {
        super('variableDeclarators', value);
    }

    static create(ctx: VariableDeclaratorsContext) {
        if (!ctx.variableDeclarator_list() || ctx.variableDeclarator_list().length === 0) {
            throw new Error('値が異常です。VariableDeclaratorsContext: ' + ctx.getText());
        }

        return new VariableDeclaratorsTypeClass(
            visitNodeList(
                new VariableVisitor(),
                ctx.variableDeclarator_list(),
                isVariableDeclaratorType,
                'variableDeclarator',
            ),
        );
    }
}

export const isVariableDeclaratorsType = (
    value: ApexCommonTypeClass<string>,
): value is VariableDeclaratorsTypeClass => {
    return value instanceof VariableDeclaratorsTypeClass;
};
