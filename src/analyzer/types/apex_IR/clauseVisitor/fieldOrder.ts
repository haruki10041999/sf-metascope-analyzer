import { FieldOrderContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FieldOrderTypeClass extends ClauseTypeClass<
    'fieldOrder',
    FieldNameTypeClass | SoqlFunctionTypeClass
> {
    private direction: 'ASC' | 'DESC' | null = null;
    private nulls: 'FIRST' | 'LAST' | null = null;
    private constructor(
        value: FieldNameTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
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
                ? isValidClass(
                      new NameVisitor().visit(ctx.fieldName()),
                      isFieldNameType,
                      'fieldName',
                  )
                : isValidClass(
                      new QueryVisitor().visit(ctx.soqlFunction()),
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
    target: CommonTypeClass<string>,
): target is FieldOrderTypeClass => {
    return target instanceof FieldOrderTypeClass;
};
