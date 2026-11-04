import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import {
    FormalParameterTypeClass,
    ParameterVisitor,
    isFormalParameterType,
} from '../parameterVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class FormalParameterListTypeClass extends ListTypeClass<
    'formalParameterList',
    FormalParameterTypeClass
> {
    private constructor(value: (FormalParameterTypeClass | ApexErrorTypeClass)[]) {
        super('formalParameterList', value);
    }

    static create(ctx: FormalParameterListContext): FormalParameterListTypeClass {
        if (!ctx.formalParameter_list() || ctx.formalParameter_list().length === 0) {
            throw new Error('値が異常です。FormalParameterListContext: ' + ctx.getText());
        }

        return new FormalParameterListTypeClass(
            isApexValidClassList(
                ctx.formalParameter_list(),
                (ctx) => new ParameterVisitor().visit(ctx),
                isFormalParameterType,
                'formalParameter',
            ),
        );
    }
}

export const isFormalParameterListType = (
    target: ApexCommonTypeClass<string>,
): target is FormalParameterListTypeClass => {
    return target instanceof FormalParameterListTypeClass;
};
