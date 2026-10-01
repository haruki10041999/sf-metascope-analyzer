import { SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

type SoqlFieldsParameterValueType = 'ALL' | 'CUSTOM' | 'STANDARD';

export class SoqlFieldsParameterTypeClass extends ParameterTypeClass<SoqlFieldsParameterValueType> {
    private constructor(value: SoqlFieldsParameterValueType | null) {
        super('soqlFieldsParameter', value, {});
    }

    static create(ctx: SoqlFieldsParameterContext): SoqlFieldsParameterTypeClass {
        if (!ctx.ALL() && !ctx.CUSTOM() && !ctx.STANDARD()) {
            throw new Error('値が異常です。SoqlFieldsParameterContext: ' + ctx.getText());
        }

        let value: SoqlFieldsParameterValueType | null = null;
        if (ctx.ALL()) {
            value = 'ALL';
        }
        if (ctx.CUSTOM()) {
            value = 'CUSTOM';
        }
        if (ctx.STANDARD()) {
            value = 'STANDARD';
        }

        return new SoqlFieldsParameterTypeClass(value);
    }
}

export const isSoqlFieldsParameterType = (target: any): target is SoqlFieldsParameterTypeClass => {
    return target instanceof SoqlFieldsParameterTypeClass;
};
