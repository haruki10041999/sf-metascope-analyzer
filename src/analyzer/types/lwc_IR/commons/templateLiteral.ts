import { isTemplateLiteral, type TemplateLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    templateElementTypePair,
    type TemplateElementTypeClass,
} from '../standardizedVisitor/templateElement';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

const templateLiteralQuasisPairs = lazyPairs(() => [templateElementTypePair] as const);
const templateLiteralExpressionsPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), ...tSTypeVisitorEvaluatePairs()] as const,
);

export type TemplateLiteralFields = {
    quasis: (TemplateElementTypeClass | LwcErrorTypeClass)[];
    expressions: (ExpressionTypeClass | TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TemplateLiteralTypeClass extends LwcCommonTypeClass<'templateLiteral'> {
    private readonly value: TemplateLiteralFields;

    private constructor(value: TemplateLiteralFields) {
        super('templateLiteral');
        this.value = value;
    }

    static create(target: TemplateLiteral, originalSource: string): TemplateLiteralTypeClass {
        return new TemplateLiteralTypeClass({
            quasis: visitNodeList(
                target.quasis,
                originalSource,
                templateLiteralQuasisPairs(),
                'TemplateLiteral.quasis',
            ),
            expressions: visitNodeList(
                target.expressions,
                originalSource,
                templateLiteralExpressionsPairs(),
                'TemplateLiteral.expressions',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TemplateLiteralFields {
        return this.value;
    }

    getQuasis(): TemplateLiteralFields['quasis'] {
        return this.value.quasis;
    }

    getExpressions(): TemplateLiteralFields['expressions'] {
        return this.value.expressions;
    }
}

export const templateLiteralTypePair: EvaluatePair<TemplateLiteral, TemplateLiteralTypeClass> =
    makeEvaluatePair(isTemplateLiteral, (target, originalSource) =>
        TemplateLiteralTypeClass.create(target, originalSource),
    );

export const isTemplateLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is TemplateLiteralTypeClass => target instanceof TemplateLiteralTypeClass;
