import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import {
    FormalParameterListTypeClass,
    ListVisitor,
    isFormalParameterListType,
} from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class FormalParametersTypeClass extends ParameterTypeClass<
    'formalParameters',
    FormalParameterListTypeClass | null
> {
    private constructor(value: FormalParameterListTypeClass | ApexErrorTypeClass | null = null) {
        super('formalParameters', value);
    }

    static create(ctx: FormalParametersContext): FormalParametersTypeClass {
        return new FormalParametersTypeClass(
            ctx.formalParameterList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.formalParameterList()),
                      isFormalParameterListType,
                      'formalParameterList',
                  )
                : null,
        );
    }
}

export const isFormalParametersType = (
    target: ApexCommonTypeClass<string>,
): target is FormalParametersTypeClass => {
    return target instanceof FormalParametersTypeClass;
};
