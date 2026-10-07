import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { EntryTypeClass } from '../entryVisitor';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { TypeOfTypeClass, ClauseVisitor, isTypeOfType } from '../clauseVisitor';
import {
    SubQueryTypeClass,
    SoqlFunctionTypeClass,
    QueryVisitor,
    isSubQueryType,
    isSoqlFunctionType,
} from '../queryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type SelectEntryTypeClassType =
    FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass;

export class SelectEntryTypeClass extends EntryTypeClass<SelectEntryTypeClassType> {
    private alias: SoqlIdTypeClass | ErrorTypeClass | null;

    private constructor(
        value: SelectEntryTypeClassType | ErrorTypeClass,
        alias: SoqlIdTypeClass | ErrorTypeClass | null,
    ) {
        super('selectEntry', value);
        this.alias = alias;
    }

    static create(ctx: SelectEntryContext): SelectEntryTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction() && !ctx.subQuery() && !ctx.typeOf()) {
            throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
        }

        let value: SelectEntryTypeClassType | ErrorTypeClass;
        if (ctx.fieldName()) {
            value = isValidClass(
                new NameVisitor().visit(ctx.fieldName()),
                isFieldNameType,
                'fieldName',
            );
        } else if (ctx.soqlFunction()) {
            value = isValidClass(
                new QueryVisitor().visit(ctx.soqlFunction()),
                isSoqlFunctionType,
                'soqlFunction',
            );
        } else if (ctx.subQuery()) {
            value = isValidClass(
                new QueryVisitor().visit(ctx.subQuery()),
                isSubQueryType,
                'subQuery',
            );
        } else {
            value = isValidClass(new ClauseVisitor().visit(ctx.typeOf()), isTypeOfType, 'typeOf');
        }

        // 文法上 soqlId は常に別名（`COUNT(Id) total`）
        return new SelectEntryTypeClass(
            value,
            ctx.soqlId()
                ? isValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId')
                : null,
        );
    }

    getAlias(): SoqlIdTypeClass | ErrorTypeClass | null {
        return this.alias;
    }
}

export const isSelectEntryType = (target: CommonTypeClass): target is SelectEntryTypeClass => {
    return target instanceof SelectEntryTypeClass;
};
