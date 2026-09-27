import { FieldGroupByContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';

import { SoqlFunctionType, makeSoqlFunctionType } from './soqlFunction';

export type FieldGroupByType = {
    type: 'fieldGroupBy';
    value: Omit<NameType, 'type'> | Omit<SoqlFunctionType, 'type'>;
};

export const makeFieldGroupByType = (ctx: FieldGroupByContext): FieldGroupByType => {
    if (ctx.fieldName()) {
        const { type, ...value } = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'fieldGroupBy',
            value: value,
        };
    }

    if (ctx.soqlFunction()) {
        const { type, ...value } = makeSoqlFunctionType(ctx.soqlFunction());
        return {
            type: 'fieldGroupBy',
            value: value,
        };
    }

    throw new Error('値が異常です。FieldGroupByContext:' + ctx.getText());
};
