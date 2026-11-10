import { ForControlContext } from '@apexdevtools/apex-parser';

import { EnhancedForControlTypeClass } from './enhancedForControl';
import { ForInitTypeClass } from './forInit';
import { ForUpdateTypeClass } from './forUpdate';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitOptionalNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/**
 * for の制御部。文法は `enhancedForControl | forInit? ; expression? ; forUpdate?` の 2 通り
 * - enhanced: 拡張 for (`for (X x : xs)`)
 * - classic: 通常の for。初期化・条件・更新はどれも省略できる (`for (;;)`)
 */
export type ForControlType = TypeField<'forControl'> &
    (
        | { kind: 'enhanced'; control: EnhancedForControlTypeClass }
        | {
              kind: 'classic';
              init: ForInitTypeClass | null;
              condition: BasedExpressionTypeClass | null;
              update: ForUpdateTypeClass | null;
          }
    );

export class ForControlTypeClass extends ApexCommonTypeClass<'forControl', ForControlType> {
    private constructor(fields: FieldsOf<ForControlType>, sourceSpan: SourceSpan) {
        super('forControl', fields, sourceSpan);
    }

    static create(ctx: ForControlContext): ForControlTypeClass {
        if (ctx.enhancedForControl()) {
            return new ForControlTypeClass(
                {
                    kind: 'enhanced',
                    control: createNode(
                        ctx.enhancedForControl(),
                        (c) => EnhancedForControlTypeClass.create(c),
                        'enhancedForControl',
                    ),
                },
                getSourceSpan(ctx),
            );
        }

        return new ForControlTypeClass(
            {
                kind: 'classic',
                init: createOptionalNode(
                    ctx.forInit(),
                    (c) => ForInitTypeClass.create(c),
                    'forInit',
                ),
                condition: visitOptionalNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                update: createOptionalNode(
                    ctx.forUpdate(),
                    (c) => ForUpdateTypeClass.create(c),
                    'forUpdate',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getKind(): ForControlType['kind'] {
        return this.getFields().kind;
    }
}

export const isForControlType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ForControlTypeClass => {
    return isSpicifyApexCommonTypeClass('forControl', target);
};
