import { FieldOrderContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FieldOrderTypeClass extends ClauseTypeClass<
    FieldNameTypeClass | SoqlFunctionTypeClass
> {
    private direction: string | null = null;
    private nulls: string | null = null;
    private constructor(
        value: FieldNameTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
        direction: string | null,
        nulls: string | null,
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

    getDirection(): string | null {
        return this.direction;
    }

    getNulls(): string | null {
        return this.nulls;
    }
}

export const isFieldOrderType = (target: CommonTypeClass): target is FieldOrderTypeClass => {
    return target instanceof FieldOrderTypeClass;
};
