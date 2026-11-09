import { WhenControlContext } from '@apexdevtools/apex-parser';

import { WhenValueTypeClass } from '../valueVisitor';
import { BlockTypeClass } from '../blockVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type WhenControlType = TypeField<'whenControl'> & {
    value: WhenValueTypeClass;
    block: BlockTypeClass;
};

export class WhenControlTypeClass extends ApexCommonTypeClass<'whenControl', WhenControlType> {
    private constructor(fields: FieldsOf<WhenControlType>, sourceSpan: SourceSpan) {
        super('whenControl', fields, sourceSpan);
    }

    static create(ctx: WhenControlContext): WhenControlTypeClass {
        return new WhenControlTypeClass(
            {
                value: createNode(
                    ctx.whenValue(),
                    (c) => WhenValueTypeClass.create(c),
                    'whenValue',
                ),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): WhenControlType['value'] {
        return this.getFields().value;
    }

    getBlock(): WhenControlType['block'] {
        return this.getFields().block;
    }
}

export const isWhenControlType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhenControlTypeClass => {
    return isSpicifyApexCommonTypeClass('whenControl', target);
};
