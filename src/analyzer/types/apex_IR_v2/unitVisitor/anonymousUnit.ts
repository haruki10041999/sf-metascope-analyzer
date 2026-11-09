import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { AnonymousBlockTypeClass } from '../blockVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnonymousUnitType = TypeField<'anonymousUnit'> & {
    block: AnonymousBlockTypeClass;
};

export class AnonymousUnitTypeClass extends ApexCommonTypeClass<
    'anonymousUnit',
    AnonymousUnitType
> {
    private constructor(fields: FieldsOf<AnonymousUnitType>, sourceSpan: SourceSpan) {
        super('anonymousUnit', fields, sourceSpan);
    }

    static create(ctx: AnonymousUnitContext): AnonymousUnitTypeClass {
        return new AnonymousUnitTypeClass(
            {
                block: createNode(
                    ctx.anonymousBlock(),
                    (c) => AnonymousBlockTypeClass.create(c),
                    'anonymousBlock',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getBlock(): AnonymousUnitType['block'] {
        return this.getFields().block;
    }
}

export const isAnonymousUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousUnitTypeClass => isSpicifyApexCommonTypeClass('anonymousUnit', target);
