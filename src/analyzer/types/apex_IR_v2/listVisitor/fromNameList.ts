import { FieldNameContext, FromNameListContext, SoqlIdContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    getSourceSpan,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

// FROM 句の 1 オブジェクト（`Account a` の Account と a の組）
export class FromNameTypeClass extends ApexCommonTypeClass<'fromName'> {
    private value: FieldNameTypeClass | ApexErrorTypeClass;
    private alias: SoqlIdTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: FieldNameTypeClass | ApexErrorTypeClass,
        alias: SoqlIdTypeClass | ApexErrorTypeClass | null,
    ) {
        super('fromName');
        this.value = value;
        this.alias = alias;
    }

    static create(fieldName: FieldNameContext, alias: SoqlIdContext | null): FromNameTypeClass {
        const fromName = new FromNameTypeClass(
            visitNode(new NameVisitor(), fieldName, isFieldNameType, 'fieldName'),
            visitOptionalNode(new IdVisitor(), alias, isSoqlIdType, 'soqlId'),
        );
        const start = getSourceSpan(fieldName);
        const end = alias ? getSourceSpan(alias) : start;
        fromName.setSpan(
            start && end
                ? { context: fieldName.getText(), start: start.start, end: end.end }
                : null,
        );
        return fromName;
    }

    getValue(): FieldNameTypeClass | ApexErrorTypeClass {
        return this.value;
    }

    getAlias(): SoqlIdTypeClass | ApexErrorTypeClass | null {
        return this.alias;
    }
}

export const isFromNameType = (
    target: ApexCommonTypeClass<string>,
): target is FromNameTypeClass => {
    return target instanceof FromNameTypeClass;
};

export class FromNameListTypeClass extends ListTypeClass<'fromNameList', FromNameTypeClass> {
    private constructor(value: (FromNameTypeClass | ApexErrorTypeClass)[]) {
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

export const isFromNameListType = (
    target: ApexCommonTypeClass<string>,
): target is FromNameListTypeClass => {
    return target instanceof FromNameListTypeClass;
};
