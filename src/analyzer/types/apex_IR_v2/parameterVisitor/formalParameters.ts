import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '.';

import {
    FormalParameterListTypeClass,
    ListVisitor,
    isFormalParameterListType,
} from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitOptionalNode } from '../commonVisitor';

export class FormalParametersTypeClass extends ParameterTypeClass<
    'formalParameters',
    FormalParameterListTypeClass | null
> {
    private constructor(value: FormalParameterListTypeClass | ApexErrorTypeClass | null = null) {
        super('formalParameters', value);
    }

    static create(ctx: FormalParametersContext): FormalParametersTypeClass {
        return new FormalParametersTypeClass(
            visitOptionalNode(
                new ListVisitor(),
                ctx.formalParameterList(),
                isFormalParameterListType,
                'formalParameterList',
            ),
        );
    }
}

export const isFormalParametersType = (
    target: ApexCommonTypeClass<string>,
): target is FormalParametersTypeClass => {
    return target instanceof FormalParametersTypeClass;
};
