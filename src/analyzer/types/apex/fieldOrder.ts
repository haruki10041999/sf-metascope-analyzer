import { FieldOrderContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';

import { SoqlFunctionType, makeSoqlFunctionType } from './soqlFunction';

export type FieldOrderType = {
    type: 'fieldOrder';
    field: NameType | SoqlFunctionType;
    direction?: 'ASC' | 'DESC';
    nulls?: 'FIRST' | 'LAST';
};

export const makeFieldOrderType = (ctx: FieldOrderContext): FieldOrderType => {
    let field: NameType | SoqlFunctionType | undefined = undefined;

    if (ctx.fieldName()) {
        const { type, ...value } = new NameVisitor().visit(ctx.fieldName());
        field = value;
    }

    if (ctx.soqlFunction()) {
        const { type, ...value } = makeSoqlFunctionType(ctx.soqlFunction());
        field = value;
    }

    if (!field) {
        throw new Error('値が異常です。FieldOrderContext: ' + ctx.getText());
    }

    const fieldOrderType: FieldOrderType = {
        type: 'fieldOrder',
        field: field,
    };

    if (ctx.ASC()) {
        fieldOrderType.direction = 'ASC';
    }

    if (ctx.DESC()) {
        fieldOrderType.direction = 'DESC';
    }

    if (ctx.NULLS()) {
        if (ctx.FIRST()) {
            fieldOrderType.nulls = 'FIRST';
        }
        if (ctx.LAST()) {
            fieldOrderType.nulls = 'LAST';
        }
    }

    return fieldOrderType;
};

