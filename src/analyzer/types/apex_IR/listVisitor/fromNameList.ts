import { FieldNameContext, FromNameListContext, SoqlIdContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, getSourceSpan, isValidClass } from '../commonVisitor';

// FROM 句の 1 オブジェクト（`Account a` の Account と a の組）
export class FromNameTypeClass extends CommonTypeClass {
    private value: FieldNameTypeClass | ErrorTypeClass;
    private alias: SoqlIdTypeClass | ErrorTypeClass | null;

    private constructor(
        value: FieldNameTypeClass | ErrorTypeClass,
        alias: SoqlIdTypeClass | ErrorTypeClass | null,
    ) {
        super('fromName');
        this.value = value;
        this.alias = alias;
    }

    static create(fieldName: FieldNameContext, alias: SoqlIdContext | null): FromNameTypeClass {
        const fromName = new FromNameTypeClass(
            isValidClass(new NameVisitor().visit(fieldName), isFieldNameType, 'fieldName'),
            alias ? isValidClass(new IdVisitor().visit(alias), isSoqlIdType, 'soqlId') : null,
        );
        const start = getSourceSpan(fieldName);
        const end = alias ? getSourceSpan(alias) : start;
        fromName.setSpan(start && end ? { start: start.start, end: end.end } : null);
        return fromName;
    }

    getValue(): FieldNameTypeClass | ErrorTypeClass {
        return this.value;
    }

    getAlias(): SoqlIdTypeClass | ErrorTypeClass | null {
        return this.alias;
    }
}

export const isFromNameType = (target: CommonTypeClass): target is FromNameTypeClass => {
    return target instanceof FromNameTypeClass;
};

export class FromNameListTypeClass extends ListTypeClass<FromNameTypeClass> {
    private constructor(value: (FromNameTypeClass | ErrorTypeClass)[]) {
        super('fromNameList', value);
    }

    static create(ctx: FromNameListContext): FromNameListTypeClass {
        if (ctx.fieldName_list().length === 0) {
            throw new Error('値が異常です。FromNameListContext: ' + ctx.getText());
        }

        // 文法は `fieldName soqlId? (COMMA fieldName soqlId?)*` なので、直後の soqlId を別名として組にする
        const children = ctx.children ?? [];
        const value: FromNameTypeClass[] = [];
        children.forEach((child, index) => {
            if (child instanceof FieldNameContext) {
                const next = children[index + 1];
                value.push(
                    FromNameTypeClass.create(child, next instanceof SoqlIdContext ? next : null),
                );
            }
        });

        return new FromNameListTypeClass(value);
    }
}

export const isFromNameListType = (target: CommonTypeClass): target is FromNameListTypeClass => {
    return target instanceof FromNameListTypeClass;
};

