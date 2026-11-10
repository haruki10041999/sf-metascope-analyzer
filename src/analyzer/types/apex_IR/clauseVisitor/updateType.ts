import { UpdateTypeContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type UpdateTypeType = TypeField<'updateType'> & {
    value: 'TRACKING' | 'VIEWSTAT';
};

export class UpdateTypeTypeClass extends ApexCommonTypeClass<'updateType', UpdateTypeType> {
    private constructor(fields: FieldsOf<UpdateTypeType>, sourceSpan: SourceSpan) {
        super('updateType', fields, sourceSpan);
    }

    static create(ctx: UpdateTypeContext): UpdateTypeTypeClass {
        if (!ctx.TRACKING() && !ctx.VIEWSTAT()) {
            throw new Error('値が異常です UpdateTypeContext:' + ctx.getText());
        }

        return new UpdateTypeTypeClass(
            { value: ctx.TRACKING() ? 'TRACKING' : 'VIEWSTAT' },
            getSourceSpan(ctx),
        );
    }

    getValue(): UpdateTypeType['value'] {
        return this.getFields().value;
    }
}

export const isUpdateTypeType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UpdateTypeTypeClass => {
    return isSpicifyApexCommonTypeClass('updateType', target);
};
