import { SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoqlFieldsParameterValue = 'ALL' | 'CUSTOM' | 'STANDARD';

export type SoqlFieldsParameterType = TypeField<'soqlFieldsParameter'> & {
    value: SoqlFieldsParameterValue;
};

export class SoqlFieldsParameterTypeClass extends ApexCommonTypeClass<
    'soqlFieldsParameter',
    SoqlFieldsParameterType
> {
    private constructor(fields: FieldsOf<SoqlFieldsParameterType>, sourceSpan: SourceSpan) {
        super('soqlFieldsParameter', fields, sourceSpan);
    }

    static create(ctx: SoqlFieldsParameterContext): SoqlFieldsParameterTypeClass {
        let value: SoqlFieldsParameterValue;
        if (ctx.ALL()) {
            value = 'ALL';
        } else if (ctx.CUSTOM()) {
            value = 'CUSTOM';
        } else if (ctx.STANDARD()) {
            value = 'STANDARD';
        } else {
            // createNode を通して呼ばれるので、EXCEPTION のエラーノードになる
            throw new Error('値が異常です。SoqlFieldsParameterContext: ' + ctx.getText());
        }

        return new SoqlFieldsParameterTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): SoqlFieldsParameterType['value'] {
        return this.getFields().value;
    }
}

export const isSoqlFieldsParameterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlFieldsParameterTypeClass => {
    return isSpicifyApexCommonTypeClass('soqlFieldsParameter', target);
};
