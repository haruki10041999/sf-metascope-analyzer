import { WhenValueContext } from '@apexdevtools/apex-parser';

import { WhenLiteralTypeClass } from '../literalVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { IdTypeClass } from '../idVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** `when else`・`when 値, 値`・`when 型 変数` (sObject の型の振り分け) の 3 通り */
export type WhenValueType = TypeField<'whenValue'> &
    (
        | { kind: 'else' }
        | { kind: 'literals'; values: WhenLiteralTypeClass[] }
        | { kind: 'type'; typeRef: TypeRefTypeClass; variable: IdTypeClass }
    );

export class WhenValueTypeClass extends ApexCommonTypeClass<'whenValue', WhenValueType> {
    private constructor(fields: FieldsOf<WhenValueType>, sourceSpan: SourceSpan) {
        super('whenValue', fields, sourceSpan);
    }

    static create(ctx: WhenValueContext): WhenValueTypeClass {
        if (ctx.ELSE()) {
            return new WhenValueTypeClass({ kind: 'else' }, getSourceSpan(ctx));
        } else if (ctx.whenLiteral_list()?.length > 0) {
            return new WhenValueTypeClass(
                {
                    kind: 'literals',
                    values: createNodeList(
                        ctx.whenLiteral_list(),
                        (c) => WhenLiteralTypeClass.create(c),
                        'whenLiteral',
                    ),
                },
                getSourceSpan(ctx),
            );
        }
        return new WhenValueTypeClass(
            {
                kind: 'type',
                typeRef: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                variable: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
            },
            getSourceSpan(ctx),
        );
    }

    getKind(): WhenValueType['kind'] {
        return this.getFields().kind;
    }
}

export const isWhenValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhenValueTypeClass => {
    return isSpicifyApexCommonTypeClass('whenValue', target);
};
