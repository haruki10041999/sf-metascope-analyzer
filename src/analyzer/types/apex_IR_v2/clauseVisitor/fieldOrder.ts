import { FieldOrderContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class FieldOrderTypeClass extends ClauseTypeClass<
    'fieldOrder',
    FieldNameTypeClass | SoqlFunctionTypeClass
> {
    private direction: 'ASC' | 'DESC' | null = null;
    private nulls: 'FIRST' | 'LAST' | null = null;
    private constructor(
        value: FieldNameTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass,
        direction: 'ASC' | 'DESC' | null,
        nulls: 'FIRST' | 'LAST' | null,
    ) {
        super('fieldOrder', value);
        this.direction = direction;
        this.nulls = nulls;
    }

    static create(ctx: FieldOrderContext): FieldOrderTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction()) {
            throw new Error('値が異常です。FieldOrderContext: ' + ctx.getText());
        }

        return new FieldOrderTypeClass(
            ctx.fieldName()
                ? visitNode(new NameVisitor(), ctx.fieldName(), isFieldNameType, 'fieldName')
                : visitNode(
                      new QueryVisitor(),
                      ctx.soqlFunction(),
                      isSoqlFunctionType,
                      'soqlFunction',
                  ),
            ctx.ASC() ? 'ASC' : ctx.DESC() ? 'DESC' : null,
            ctx.FIRST() ? 'FIRST' : ctx.LAST() ? 'LAST' : null,
        );
    }

    getDirection(): 'ASC' | 'DESC' | null {
        return this.direction;
    }

    getNulls(): 'FIRST' | 'LAST' | null {
        return this.nulls;
    }
}

export const isFieldOrderType = (
    target: ApexCommonTypeClass<string>,
): target is FieldOrderTypeClass => {
    return target instanceof FieldOrderTypeClass;
};
