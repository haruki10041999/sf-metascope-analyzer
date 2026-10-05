import { FromNameListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FromNameListTypeClass extends ListTypeClass<FieldNameTypeClass | SoqlIdTypeClass> {
    private constructor(value: (FieldNameTypeClass | SoqlIdTypeClass | ErrorTypeClass)[]) {
        super('fromNameList', value);
    }

    static create(ctx: FromNameListContext): FromNameListTypeClass {
        if (
            (!ctx.fieldName_list() && ctx.fieldName_list().length === 0) ||
            (!ctx.soqlId_list() && ctx.soqlId_list().length === 0)
        ) {
            throw new Error('値が異常です。FromNameListContext: ' + ctx.getText());
        }

        return new FromNameListTypeClass([
            ...(ctx.fieldName_list() || []).map((fieldNameCtx) => {
                return isValidClass(
                    new NameVisitor().visit(fieldNameCtx),
                    isFieldNameType,
                    'fieldName',
                );
            }),
            ...(ctx.soqlId_list() || []).map((soqlIdCtx) => {
                return isValidClass(new IdVisitor().visit(soqlIdCtx), isSoqlIdType, 'soqlId');
            }),
        ]);
    }
}

export const isFromNameListType = (target: CommonTypeClass): target is FromNameListTypeClass => {
    return target instanceof FromNameListTypeClass;
};
