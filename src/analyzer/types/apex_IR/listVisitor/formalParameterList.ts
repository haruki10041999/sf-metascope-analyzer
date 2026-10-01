import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import {
    FormalParameterTypeClass,
    ParameterVisitor,
    isFormalParameterType,
} from '../parameterVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FormalParameterListTypeClass extends ListTypeClass<FormalParameterTypeClass[]> {
    private constructor(
        value: FormalParameterTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('formalParameterList', value, errorClasses);
    }

    static create(ctx: FormalParameterListContext): FormalParameterListTypeClass {
        if (!ctx.formalParameter_list() || ctx.formalParameter_list().length === 0) {
            throw new Error('値が異常です。FormalParameterListContext: ' + ctx.getText());
        }

        const value: FormalParameterTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.formalParameter_list().forEach((formalParameterCtx, index) => {
            const parameterTypeClass = new ParameterVisitor().visit(formalParameterCtx);
            if (isFormalParameterType(parameterTypeClass)) {
                value.push(parameterTypeClass);
            } else if (isErrorType(parameterTypeClass)) {
                errorClasses[`value_${index}`] = parameterTypeClass;
            }
        });

        return new FormalParameterListTypeClass(value, errorClasses);
    }
}

export const isFormalParameterListType = (
    target: CommonTypeClass,
): target is FormalParameterListTypeClass => {
    return target instanceof FormalParameterListTypeClass;
};
