import { WhenClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { FieldNameListTypeClass, ListVisitor, isFieldNameListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WhenClauseTypeClass extends ClauseTypeClass<FieldNameTypeClass> {
    private field: FieldNameListTypeClass | ErrorTypeClass;

    private constructor(
        value: FieldNameTypeClass | ErrorTypeClass,
        field: FieldNameListTypeClass | ErrorTypeClass,
    ) {
        super('whenClause', value);
        this.field = field;
    }

    static create(ctx: WhenClauseContext): WhenClauseTypeClass {
        if (!ctx.fieldName() || !ctx.fieldNameList()) {
            throw new Error('値が異常です。WhenClauseContext: ' + ctx.getText());
        }

        return new WhenClauseTypeClass(
            isValidClass(new NameVisitor().visit(ctx.fieldName()), isFieldNameType, 'fieldName'),
            isValidClass(
                new ListVisitor().visit(ctx.fieldNameList()),
                isFieldNameListType,
                'fieldNameList',
            ),
        );
    }

    getField(): FieldNameListTypeClass | ErrorTypeClass {
        return this.field;
    }
}

export const isWhenClauseType = (target: CommonTypeClass): target is WhenClauseTypeClass => {
    return target instanceof WhenClauseTypeClass;
};
