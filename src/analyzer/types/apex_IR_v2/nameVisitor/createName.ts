import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { IdCreatedNamePairTypeClass } from '../pairVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CreatedNameType = TypeField<'createdName'> & {
    value: IdCreatedNamePairTypeClass[];
};

export class CreatedNameTypeClass extends ApexCommonTypeClass<'createdName', CreatedNameType> {
    private constructor(fields: FieldsOf<CreatedNameType>, sourceSpan: SourceSpan) {
        super('createdName', fields, sourceSpan);
    }

    static create(ctx: CreatedNameContext): CreatedNameTypeClass {
        return new CreatedNameTypeClass(
            {
                value: createNodeList(
                    ctx.idCreatedNamePair_list(),
                    (c) => IdCreatedNamePairTypeClass.create(c),
                    'idCreatedNamePair',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): CreatedNameType['value'] {
        return this.getFields().value;
    }
}

export const isCreatedNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CreatedNameTypeClass => isSpicifyApexCommonTypeClass('createdName', target);
