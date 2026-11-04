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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

type SelectEntryTypeClassType =
    FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass;

export class SelectEntryTypeClass extends EntryTypeClass<'selectEntry', SelectEntryTypeClassType> {
    private alias: SoqlIdTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: SelectEntryTypeClassType | ApexErrorTypeClass,
        alias: SoqlIdTypeClass | ApexErrorTypeClass | null,
    ) {
        super('selectEntry', value);
        this.alias = alias;
    }

    static create(ctx: SelectEntryContext): SelectEntryTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction() && !ctx.subQuery() && !ctx.typeOf()) {
            throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
        }

        let value: SelectEntryTypeClassType | ApexErrorTypeClass;
        if (ctx.fieldName()) {
            value = isApexValidClass(
                new NameVisitor().visit(ctx.fieldName()),
                isFieldNameType,
                'fieldName',
            );
        } else if (ctx.soqlFunction()) {
            value = isApexValidClass(
                new QueryVisitor().visit(ctx.soqlFunction()),
                isSoqlFunctionType,
                'soqlFunction',
            );
        } else if (ctx.subQuery()) {
            value = isApexValidClass(
                new QueryVisitor().visit(ctx.subQuery()),
                isSubQueryType,
                'subQuery',
            );
        } else {
            value = isApexValidClass(
                new ClauseVisitor().visit(ctx.typeOf()),
                isTypeOfType,
                'typeOf',
            );
        }

        // 文法上 soqlId は常に別名（`COUNT(Id) total`）
        return new SelectEntryTypeClass(
            value,
            ctx.soqlId()
                ? isApexValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId')
                : null,
        );
    }

    getAlias(): SoqlIdTypeClass | ApexErrorTypeClass | null {
        return this.alias;
    }
}

export const isSelectEntryType = (
    target: ApexCommonTypeClass<string>,
): target is SelectEntryTypeClass => {
    return target instanceof SelectEntryTypeClass;
};
