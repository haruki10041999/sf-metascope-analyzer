import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { AnonymousBlockTypeClass } from '../blockVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnonymousUnitType = TypeField<'anonymousUnit'> & {
    block: AnonymousBlockTypeClass;
};

export class AnonymousUnitTypeClass extends ApexCommonTypeClass<
    'anonymousUnit',
    AnonymousUnitType
> {
    private constructor(block: AnonymousBlockTypeClass, sourceSpan: SourceSpan) {
        super('anonymousUnit', { block: block }, sourceSpan);
    }

    static create(ctx: AnonymousUnitContext): AnonymousUnitTypeClass {
        return new AnonymousUnitTypeClass(
            AnonymousBlockTypeClass.create(ctx.anonymousBlock()),
            getSourceSpan(ctx),
        );
    }
}

export const isAnonymousUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousUnitTypeClass => {
    return isSpicifyApexCommonTypeClass('anonymousUnit', target);
};
