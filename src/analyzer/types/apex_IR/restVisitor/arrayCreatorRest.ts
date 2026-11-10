import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ArrayInitializerTypeClass } from '../variableVisitor';
import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/**
 * `new X[n]` (sized: 要素数) と `new X[]{ ... }`・`new X[]` (initialized: 初期化子。なければ null) の 2 通り
 */
export type ArrayCreatorRestType = TypeField<'arrayCreatorRest'> &
    (
        | { kind: 'sized'; size: BasedExpressionTypeClass }
        | { kind: 'initialized'; initializer: ArrayInitializerTypeClass | null }
    );

export class ArrayCreatorRestTypeClass extends ApexCommonTypeClass<
    'arrayCreatorRest',
    ArrayCreatorRestType
> {
    private constructor(fields: FieldsOf<ArrayCreatorRestType>, sourceSpan: SourceSpan) {
        super('arrayCreatorRest', fields, sourceSpan);
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        return new ArrayCreatorRestTypeClass(
            ctx.expression()
                ? {
                      kind: 'sized',
                      size: visitNode(
                          new ExpressionVisitor(),
                          ctx.expression(),
                          isBasedExpressionType,
                          'expression',
                      ),
                  }
                : {
                      kind: 'initialized',
                      initializer: createOptionalNode(
                          ctx.arrayInitializer(),
                          (c) => ArrayInitializerTypeClass.create(c),
                          'arrayInitializer',
                      ),
                  },
            getSourceSpan(ctx),
        );
    }

    getKind(): ArrayCreatorRestType['kind'] {
        return this.getFields().kind;
    }
}

export const isArrayCreatorRestType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArrayCreatorRestTypeClass => isSpicifyApexCommonTypeClass('arrayCreatorRest', target);
