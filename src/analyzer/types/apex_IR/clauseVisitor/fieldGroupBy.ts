import { FieldGroupByContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FieldGroupByTypeClass extends ClauseTypeClass<
    FieldNameTypeClass | SoqlFunctionTypeClass
> {
    private constructor(value: FieldNameTypeClass | SoqlFunctionTypeClass | ErrorTypeClass) {
        super('fieldGroupBy', value);
    }

    static create(ctx: FieldGroupByContext): FieldGroupByTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction()) {
            throw new Error('値が異常です。FieldGroupByContext:' + ctx.getText());
        }

        return new FieldGroupByTypeClass(
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
        );
    }
}

export const isFieldGroupByType = (target: CommonTypeClass): target is FieldGroupByTypeClass => {
    return target instanceof FieldGroupByTypeClass;
};
