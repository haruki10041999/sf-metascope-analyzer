import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { TriggerCaseTypeClass } from '.';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { IdTypeClass } from '../idVisitor';
import { TriggerBlockTypeClass } from '../blockVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerUnitType = TypeField<'triggerUnit'> & {
    name: IdTypeClass;
    object: IdTypeClass;
    triggerCase: TriggerCaseTypeClass[];
    block: TriggerBlockTypeClass;
};

export class TriggerUnitTypeClass extends ApexCommonTypeClass<'triggerUnit', TriggerUnitType> {
    private constructor(
        name: IdTypeClass,
        object: IdTypeClass,
        triggerCase: TriggerCaseTypeClass[],
        block: TriggerBlockTypeClass,
        sourceSpan: SourceSpan,
    ) {
        super(
            'triggerUnit',
            {
                name: name,
                object: object,
                triggerCase: triggerCase,
                block,
            },
            sourceSpan,
        );
    }

    static create(ctx: TriggerUnitContext): TriggerUnitTypeClass {
        return new TriggerUnitTypeClass(
            IdTypeClass.create(ctx.id(0)),
            IdTypeClass.create(ctx.id(1)),
            ctx.triggerCase_list().map((t) => TriggerCaseTypeClass.create(t)),
            TriggerBlockTypeClass.create(ctx.triggerBlock()),
            getSourceSpan(ctx),
        );
    }
}

export const isTriggerUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerUnitTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerUnit', target);
};
