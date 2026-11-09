import { FieldGroupByContext } from '@apexdevtools/apex-parser';

import { SoqlFunctionTypeClass } from '../queryVisitor';
import { FieldNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldGroupByType = TypeField<'fieldGroupBy'> & {
    value: FieldNameTypeClass | SoqlFunctionTypeClass;
};

export class FieldGroupByTypeClass extends ApexCommonTypeClass<'fieldGroupBy', FieldGroupByType> {
    private constructor(fields: FieldsOf<FieldGroupByType>, sourceSpan: SourceSpan) {
        super('fieldGroupBy', fields, sourceSpan);
    }

    static create(ctx: FieldGroupByContext): FieldGroupByTypeClass {
        if (ctx.fieldName()) {
            return new FieldGroupByTypeClass(
                {
                    value: createNode(
                        ctx.fieldName(),
                        (c) => FieldNameTypeClass.create(c),
                        'fieldName',
                    ),
                },
                getSourceSpan(ctx),
            );
        } else {
            return new FieldGroupByTypeClass(
                {
                    value: createNode(
                        ctx.soqlFunction(),
                        (c) => SoqlFunctionTypeClass.create(c),
                        'soqlFunction',
                    ),
                },
                getSourceSpan(ctx),
            );
        }
    }

    getValue(): FieldGroupByType['value'] {
        return this.getFields().value;
    }
}

export const isFieldGroupByType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldGroupByTypeClass => {
    return isSpicifyApexCommonTypeClass('fieldGroupBy', target);
};
