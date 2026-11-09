import { FieldOrderContext } from '@apexdevtools/apex-parser';

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

export type FieldOrderType = TypeField<'fieldOrder'> & {
    value: FieldNameTypeClass | SoqlFunctionTypeClass;
    direction: 'ASC' | 'DESC' | null;
    nulls: 'FIRST' | 'LAST' | null;
};

export class FieldOrderTypeClass extends ApexCommonTypeClass<'fieldOrder', FieldOrderType> {
    private constructor(fields: FieldsOf<FieldOrderType>, sourceSpan: SourceSpan) {
        super('fieldOrder', fields, sourceSpan);
    }

    static create(ctx: FieldOrderContext): FieldOrderTypeClass {
        let value: FieldOrderType['value'];
        if (ctx.fieldName()) {
            value = createNode(ctx.fieldName(), (c) => FieldNameTypeClass.create(c), 'fieldName');
        } else {
            value = createNode(
                ctx.soqlFunction(),
                (c) => SoqlFunctionTypeClass.create(c),
                'soqlFunction',
            );
        }

        return new FieldOrderTypeClass(
            {
                value,
                direction: ctx.ASC() ? 'ASC' : ctx.DESC() ? 'DESC' : null,
                nulls: ctx.FIRST() ? 'FIRST' : ctx.LAST() ? 'LAST' : null,
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FieldOrderType['value'] {
        return this.getFields().value;
    }

    getDirection(): FieldOrderType['direction'] {
        return this.getFields().direction;
    }

    getNulls(): FieldOrderType['nulls'] {
        return this.getFields().nulls;
    }
}

export const isFieldOrderType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldOrderTypeClass => {
    return isSpicifyApexCommonTypeClass('fieldOrder', target);
};
