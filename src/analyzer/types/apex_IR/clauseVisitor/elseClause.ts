import { ElseClauseContext } from '@apexdevtools/apex-parser';

import { FieldNameListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ElseClauseType = TypeField<'elseClause'> & {
    value: FieldNameListTypeClass;
};

export class ElseClauseTypeClass extends ApexCommonTypeClass<'elseClause', ElseClauseType> {
    private constructor(fields: FieldsOf<ElseClauseType>, sourceSpan: SourceSpan) {
        super('elseClause', fields, sourceSpan);
    }

    static create(ctx: ElseClauseContext): ElseClauseTypeClass {
        return new ElseClauseTypeClass(
            {
                value: createNode(
                    ctx.fieldNameList(),
                    (c) => FieldNameListTypeClass.create(c),
                    'fieldNameList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ElseClauseType['value'] {
        return this.getFields().value;
    }
}

export const isElseClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ElseClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('elseClause', target);
};
