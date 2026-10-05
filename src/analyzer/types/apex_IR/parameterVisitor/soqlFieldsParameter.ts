import { SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

type SoqlFieldsParameterValueType = 'ALL' | 'CUSTOM' | 'STANDARD';

export class SoqlFieldsParameterTypeClass extends ParameterTypeClass<SoqlFieldsParameterValueType> {
    private constructor(value: SoqlFieldsParameterValueType | ErrorTypeClass) {
        super('soqlFieldsParameter', value);
    }

    static create(ctx: SoqlFieldsParameterContext): SoqlFieldsParameterTypeClass {
        if (!ctx.ALL() && !ctx.CUSTOM() && !ctx.STANDARD()) {
            throw new Error('値が異常です。SoqlFieldsParameterContext: ' + ctx.getText());
        }

        return new SoqlFieldsParameterTypeClass(
            ctx.ALL() ? 'ALL' : ctx.CUSTOM() ? 'CUSTOM' : 'STANDARD',
        );
    }
}

export const isSoqlFieldsParameterType = (
    target: CommonTypeClass,
): target is SoqlFieldsParameterTypeClass => {
    return target instanceof SoqlFieldsParameterTypeClass;
};
