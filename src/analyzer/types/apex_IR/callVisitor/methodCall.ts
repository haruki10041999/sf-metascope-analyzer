import { MethodCallContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** `id(...)`・`this(...)`・`super(...)` の 3 通り。メソッド名 (value) があるのは method のときだけ */
export type MethodCallType = TypeField<'methodCall'> & {
    param: ExpressionListTypeClass | null;
} & ({ kind: 'method'; value: IdTypeClass } | { kind: 'this' | 'super' });

export class MethodCallTypeClass extends ApexCommonTypeClass<'methodCall', MethodCallType> {
    private constructor(fields: FieldsOf<MethodCallType>, sourceSpan: SourceSpan) {
        super('methodCall', fields, sourceSpan);
    }

    static create(ctx: MethodCallContext): MethodCallTypeClass {
        const param = createOptionalNode(
            ctx.expressionList(),
            (c) => ExpressionListTypeClass.create(c),
            'expressionList',
        );

        if (ctx.THIS()) {
            return new MethodCallTypeClass({ kind: 'this', param }, getSourceSpan(ctx));
        } else if (ctx.SUPER()) {
            return new MethodCallTypeClass({ kind: 'super', param }, getSourceSpan(ctx));
        } else if (ctx.id()) {
            return new MethodCallTypeClass(
                {
                    kind: 'method',
                    value: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                    param,
                },
                getSourceSpan(ctx),
            );
        }
        throw new Error('値が異常です。MethodCallContext: ' + ctx.getText());
    }

    getKind(): MethodCallType['kind'] {
        return this.getFields().kind;
    }

    getParam(): MethodCallType['param'] {
        return this.getFields().param;
    }
}

export const isMethodCallType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MethodCallTypeClass => isSpicifyApexCommonTypeClass('methodCall', target);
