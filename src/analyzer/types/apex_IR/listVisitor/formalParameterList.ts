import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { FormalParameterTypeClass } from '../parameterVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FormalParameterListType = TypeField<'formalParameterList'> & {
    value: FormalParameterTypeClass[];
};

export class FormalParameterListTypeClass extends ApexCommonTypeClass<
    'formalParameterList',
    FormalParameterListType
> {
    private constructor(fields: FieldsOf<FormalParameterListType>, sourceSpan: SourceSpan) {
        super('formalParameterList', fields, sourceSpan);
    }

    static create(ctx: FormalParameterListContext): FormalParameterListTypeClass {
        return new FormalParameterListTypeClass(
            {
                value: createNodeList(
                    ctx.formalParameter_list(),
                    (c) => FormalParameterTypeClass.create(c),
                    'formalParameter',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FormalParameterListType['value'] {
        return this.getFields().value;
    }
}

export const isFormalParameterListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FormalParameterListTypeClass =>
    isSpicifyApexCommonTypeClass('formalParameterList', target);
