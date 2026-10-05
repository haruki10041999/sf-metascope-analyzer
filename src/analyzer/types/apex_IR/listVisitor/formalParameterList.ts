import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import {
    FormalParameterTypeClass,
    ParameterVisitor,
    isFormalParameterType,
} from '../parameterVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FormalParameterListTypeClass extends ListTypeClass<FormalParameterTypeClass> {
    private constructor(value: (FormalParameterTypeClass | ErrorTypeClass)[]) {
        super('formalParameterList', value);
    }

    static create(ctx: FormalParameterListContext): FormalParameterListTypeClass {
        if (!ctx.formalParameter_list() || ctx.formalParameter_list().length === 0) {
            throw new Error('値が異常です。FormalParameterListContext: ' + ctx.getText());
        }

        return new FormalParameterListTypeClass(
            isValidClassList(
                ctx.formalParameter_list(),
                (ctx) => new ParameterVisitor().visit(ctx),
                isFormalParameterType,
                'formalParameter',
            ),
        );
    }
}

export const isFormalParameterListType = (
    target: CommonTypeClass,
): target is FormalParameterListTypeClass => {
    return target instanceof FormalParameterListTypeClass;
};
