import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTemplateLiteral, type TemplateLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { TemplateElementTypeClass } from '../standardizedVisitor/templateElement';

/** `${expression}` とそのあとの文字列 */
export type TemplateLiteralSpan = {
    expression: ExpressionTypeClass;
    tail: TemplateElementTypeClass;
};

/**
 * テンプレート文字列。先頭の文字列 (head) と、式とそのあとの文字列の組 (spans) に分ける
 * (Babel の quasis は expressions より 1 個多い)
 */
export type TemplateLiteralFields = TypeField<'templateLiteral'> & {
    head: TemplateElementTypeClass;
    spans: TemplateLiteralSpan[];
};

export class TemplateLiteralTypeClass extends LwcCommonTypeClass<
    'templateLiteral',
    TemplateLiteralFields
> {
    private constructor(value: FieldsOf<TemplateLiteralFields>, sourceSpan: SourceSpan) {
        super('templateLiteral', value, sourceSpan);
    }

    static create(target: TemplateLiteral, originalSource: string): TemplateLiteralTypeClass {
        const [head, ...tails] = target.quasis;
        if (head == null || tails.length !== target.expressions.length) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'テンプレート文字列の quasis は expressions より 1 個多くなければなりません',
            );
        }
        return new TemplateLiteralTypeClass(
            {
                head: TemplateElementTypeClass.create(head, originalSource),
                spans: target.expressions.map((expression, index) => ({
                    expression: visitNode(
                        expression,
                        originalSource,
                        expressionVisitorEvaluatePairs(),
                        'ExpressionVisitor',
                    ),
                    tail: TemplateElementTypeClass.create(tails[index]!, originalSource),
                })),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getHead(): TemplateLiteralFields['head'] {
        return this.getFields().head;
    }

    getSpans(): TemplateLiteralFields['spans'] {
        return this.getFields().spans;
    }
}

export const templateLiteralTypePair: EvaluatePair<TemplateLiteral, TemplateLiteralTypeClass> =
    makeEvaluatePair(isTemplateLiteral, (target, originalSource) =>
        TemplateLiteralTypeClass.create(target, originalSource),
    );

export const isTemplateLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TemplateLiteralTypeClass => target instanceof TemplateLiteralTypeClass;
