import { WhenClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { FieldNameListTypeClass, ListVisitor, isFieldNameListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class WhenClauseTypeClass extends ClauseTypeClass<'whenClause', FieldNameTypeClass> {
    private field: FieldNameListTypeClass | ApexErrorTypeClass;

    private constructor(
        value: FieldNameTypeClass | ApexErrorTypeClass,
        field: FieldNameListTypeClass | ApexErrorTypeClass,
    ) {
        super('whenClause', value);
        this.field = field;
    }

    static create(ctx: WhenClauseContext): WhenClauseTypeClass {
        if (!ctx.fieldName() || !ctx.fieldNameList()) {
            throw new Error('値が異常です。WhenClauseContext: ' + ctx.getText());
        }

        return new WhenClauseTypeClass(
            visitNode(new NameVisitor(), ctx.fieldName(), isFieldNameType, 'fieldName'),
            visitNode(new ListVisitor(), ctx.fieldNameList(), isFieldNameListType, 'fieldNameList'),
        );
    }

    getField(): FieldNameListTypeClass | ApexErrorTypeClass {
        return this.field;
    }
}

export const isWhenClauseType = (
    target: ApexCommonTypeClass<string>,
): target is WhenClauseTypeClass => {
    return target instanceof WhenClauseTypeClass;
};
