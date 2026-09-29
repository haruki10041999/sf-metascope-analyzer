import { FieldOrderContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '../queryVisitor';
import { NameType, NameVisitor } from '../nameVisitor';

export type FieldOrderType = {
    type: 'fieldOrder';
    clause: {
        name: NameType | QueryType;
        direction?: 'ASC' | 'DESC';
        nulls?: 'FIRST' | 'LAST';
    };
};

export const makeFieldOrderType = (ctx: FieldOrderContext): FieldOrderType => {
    let field: NameType | QueryType | undefined = undefined;

    if (ctx.fieldName()) {
        const value = new NameVisitor().visit(ctx.fieldName());
        field = value;
    }

    if (ctx.soqlFunction()) {
        const value = new QueryVisitor().visit(ctx.soqlFunction());
        field = value;
    }

    if (!field) {
        throw new Error('値が異常です。FieldOrderContext: ' + ctx.getText());
    }

    const fieldOrderType: FieldOrderType = {
        type: 'fieldOrder',
        clause: {
            name: field,
        },
    };

    if (ctx.ASC()) {
        fieldOrderType.clause.direction = 'ASC';
    }

    if (ctx.DESC()) {
        fieldOrderType.clause.direction = 'DESC';
    }

    if (ctx.NULLS()) {
        if (ctx.FIRST()) {
            fieldOrderType.clause.nulls = 'FIRST';
        }
        if (ctx.LAST()) {
            fieldOrderType.clause.nulls = 'LAST';
        }
    }

    return fieldOrderType;
};

