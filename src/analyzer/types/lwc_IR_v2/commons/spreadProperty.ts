import { isSpreadProperty, type Node, type SpreadProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

// 非推奨の別名。Babel 8 の parse は作らず SpreadElement を使う。isSpreadProperty は型の判定 (target is ...) にならないので包む
const isSpreadPropertyNode = (target: Node | null | undefined): target is SpreadProperty =>
    isSpreadProperty(target);

export type SpreadPropertyFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass;
};

export class SpreadPropertyTypeClass extends LwcCommonTypeClass<'spreadProperty'> {
    private readonly value: SpreadPropertyFields;

    private constructor(value: SpreadPropertyFields) {
        super('spreadProperty');
        this.value = value;
    }

    static create(target: SpreadProperty, originalSource: string): SpreadPropertyTypeClass {
        return new SpreadPropertyTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): SpreadPropertyFields {
        return this.value;
    }

    getArgument(): SpreadPropertyFields['argument'] {
        return this.value.argument;
    }
}

export const spreadPropertyTypePair: EvaluatePair<SpreadProperty, SpreadPropertyTypeClass> =
    makeEvaluatePair(isSpreadPropertyNode, (target, originalSource) =>
        SpreadPropertyTypeClass.create(target, originalSource),
    );

export const isSpreadPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is SpreadPropertyTypeClass => target instanceof SpreadPropertyTypeClass;
