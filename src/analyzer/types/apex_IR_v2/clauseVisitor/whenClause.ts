import { WhenClauseContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass } from '../nameVisitor';
import { FieldNameListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type WhenClauseType = TypeField<'whenClause'> & {
    value: FieldNameTypeClass;
    field: FieldNameListTypeClass;
};

export class WhenClauseTypeClass extends ApexCommonTypeClass<'whenClause', WhenClauseType> {
    private constructor(fields: FieldsOf<WhenClauseType>, sourceSpan: SourceSpan) {
        super('whenClause', fields, sourceSpan);
    }

    static create(ctx: WhenClauseContext): WhenClauseTypeClass {
        return new WhenClauseTypeClass(
            {
                value: createNode(
                    ctx.fieldName(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
                field: createNode(
                    ctx.fieldNameList(),
                    (c) => FieldNameListTypeClass.create(c),
                    'fieldNameList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): WhenClauseType['value'] {
        return this.getFields().value;
    }

    getField(): WhenClauseType['field'] {
        return this.getFields().field;
    }
}

export const isWhenClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhenClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('whenClause', target);
};
