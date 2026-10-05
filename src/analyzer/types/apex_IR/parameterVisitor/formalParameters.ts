import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import {
    FormalParameterListTypeClass,
    ListVisitor,
    isFormalParameterListType,
} from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FormalParametersTypeClass extends ParameterTypeClass<FormalParameterListTypeClass | null> {
    private constructor(value: FormalParameterListTypeClass | ErrorTypeClass | null = null) {
        super('formalParameters', value);
    }

    static create(ctx: FormalParametersContext): FormalParametersTypeClass {
        return new FormalParametersTypeClass(
            ctx.formalParameterList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.formalParameterList()),
                      isFormalParameterListType,
                      'formalParameterList',
                  )
                : null,
        );
    }
}

export const isFormalParametersType = (
    target: CommonTypeClass,
): target is FormalParametersTypeClass => {
    return target instanceof FormalParametersTypeClass;
};
