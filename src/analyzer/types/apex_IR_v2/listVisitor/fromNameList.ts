import { FieldNameContext, FromNameListContext, SoqlIdContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass } from '../nameVisitor';
import { SoqlIdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FromNameType = TypeField<'fromName'> & {
    value: FieldNameTypeClass;
    alias: SoqlIdTypeClass | null;
};

// FROM 句の 1 オブジェクト（`Account a` の Account と a の組）。文法上のルールはない
export class FromNameTypeClass extends ApexCommonTypeClass<'fromName', FromNameType> {
    private constructor(fields: FieldsOf<FromNameType>, sourceSpan: SourceSpan) {
        super('fromName', fields, sourceSpan);
    }

    static create(fieldName: FieldNameContext, alias: SoqlIdContext | null): FromNameTypeClass {
        const start = getSourceSpan(fieldName);
        const end = alias ? getSourceSpan(alias) : start;
        const stop = alias?.stop ?? fieldName.stop;
        const context =
            alias && fieldName.start && stop
                ? (fieldName.start.getInputStream()?.getText(fieldName.start.start, stop.stop) ??
                  `${start.context} ${end.context}`)
                : start.context;

        return new FromNameTypeClass(
            {
                value: createNode(fieldName, (c) => FieldNameTypeClass.create(c), 'fieldName'),
                alias: createOptionalNode(alias, (c) => SoqlIdTypeClass.create(c), 'soqlId'),
            },
            { context, start: start.start, end: end.end },
        );
    }

    getValue(): FromNameType['value'] {
        return this.getFields().value;
    }

    getAlias(): FromNameType['alias'] {
        return this.getFields().alias;
    }
}

export const isFromNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FromNameTypeClass => isSpicifyApexCommonTypeClass('fromName', target);

export type FromNameListType = TypeField<'fromNameList'> & {
    value: FromNameTypeClass[];
};

export class FromNameListTypeClass extends ApexCommonTypeClass<'fromNameList', FromNameListType> {
    private constructor(fields: FieldsOf<FromNameListType>, sourceSpan: SourceSpan) {
        super('fromNameList', fields, sourceSpan);
    }

    static create(ctx: FromNameListContext): FromNameListTypeClass {
        // 文法は `fieldName soqlId? (COMMA fieldName soqlId?)*` なので、直後の soqlId を別名として組にする
        const children = ctx.children ?? [];
        const value: FromNameListType['value'] = [];
        children.forEach((child, index) => {
            if (child instanceof FieldNameContext) {
                const next = children[index + 1];
                value.push(
                    FromNameTypeClass.create(child, next instanceof SoqlIdContext ? next : null),
                );
            }
        });

        return new FromNameListTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): FromNameListType['value'] {
        return this.getFields().value;
    }
}

export const isFromNameListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FromNameListTypeClass => isSpicifyApexCommonTypeClass('fromNameList', target);
