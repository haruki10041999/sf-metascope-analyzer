import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import {
    FormalParameterListTypeClass,
    ListVisitor,
    isFormalParameterListType,
} from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FormalParametersTypeClass extends ParameterTypeClass<FormalParameterListTypeClass> {
    private constructor(
        value: FormalParameterListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('formalParameters', value, errorClasses);
    }

    static create(ctx: FormalParametersContext): FormalParametersTypeClass {
        let value: FormalParameterListTypeClass | null = null;
        let errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.formalParameterList()) {
            const listTypeClass = new ListVisitor().visit(ctx.formalParameterList());
            if (isFormalParameterListType(listTypeClass)) {
                value = listTypeClass;
            } else if (isErrorType(listTypeClass)) {
                errorClasses['value'] = listTypeClass;
            }
        }

        return new FormalParametersTypeClass(value, errorClasses);
    }
}

export const isFormalParametersType = (
    target: CommonTypeClass,
): target is FormalParametersTypeClass => {
    return target instanceof FormalParametersTypeClass;
};
