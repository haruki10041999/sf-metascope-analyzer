import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { TriggerCaseTypeClass } from './triggerCase';
import { IdTypeClass } from '../idVisitor';
import { TriggerBlockTypeClass } from '../blockVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerUnitType = TypeField<'triggerUnit'> & {
    /** トリガー名 */
    name: IdTypeClass;
    /** 対象のオブジェクト (`on Account`) */
    object: IdTypeClass;
    triggerCase: TriggerCaseTypeClass[];
    block: TriggerBlockTypeClass;
};

export class TriggerUnitTypeClass extends ApexCommonTypeClass<'triggerUnit', TriggerUnitType> {
    private constructor(fields: FieldsOf<TriggerUnitType>, sourceSpan: SourceSpan) {
        super('triggerUnit', fields, sourceSpan);
    }

    static create(ctx: TriggerUnitContext): TriggerUnitTypeClass {
        return new TriggerUnitTypeClass(
            {
                name: createNode(ctx.id(0), (c) => IdTypeClass.create(c), 'id'),
                object: createNode(ctx.id(1), (c) => IdTypeClass.create(c), 'id'),
                triggerCase: createNodeList(
                    ctx.triggerCase_list(),
                    (c) => TriggerCaseTypeClass.create(c),
                    'triggerCase',
                ),
                block: createNode(
                    ctx.triggerBlock(),
                    (c) => TriggerBlockTypeClass.create(c),
                    'triggerBlock',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getName(): TriggerUnitType['name'] {
        return this.getFields().name;
    }

    getObject(): TriggerUnitType['object'] {
        return this.getFields().object;
    }

    getTriggerCase(): TriggerUnitType['triggerCase'] {
        return this.getFields().triggerCase;
    }

    getBlock(): TriggerUnitType['block'] {
        return this.getFields().block;
    }
}

export const isTriggerUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerUnitTypeClass => isSpicifyApexCommonTypeClass('triggerUnit', target);
