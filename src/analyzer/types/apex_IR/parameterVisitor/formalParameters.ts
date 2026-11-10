import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { FormalParameterListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FormalParametersType = TypeField<'formalParameters'> & {
    /** `()` のように引数がなければ null */
    parameterList: FormalParameterListTypeClass | null;
};

export class FormalParametersTypeClass extends ApexCommonTypeClass<
    'formalParameters',
    FormalParametersType
> {
    private constructor(fields: FieldsOf<FormalParametersType>, sourceSpan: SourceSpan) {
        super('formalParameters', fields, sourceSpan);
    }

    static create(ctx: FormalParametersContext): FormalParametersTypeClass {
        return new FormalParametersTypeClass(
            {
                parameterList: createOptionalNode(
                    ctx.formalParameterList(),
                    (c) => FormalParameterListTypeClass.create(c),
                    'formalParameterList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getParameterList(): FormalParametersType['parameterList'] {
        return this.getFields().parameterList;
    }
}

export const isFormalParametersType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FormalParametersTypeClass => {
    return isSpicifyApexCommonTypeClass('formalParameters', target);
};
