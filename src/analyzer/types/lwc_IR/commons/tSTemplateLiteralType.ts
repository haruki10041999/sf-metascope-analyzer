import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTemplateLiteralType, type TSTemplateLiteralType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { TemplateElementTypeClass } from '../standardizedVisitor/templateElement';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

/** `${T}` とそのあとの文字列 */
export type TSTemplateLiteralTypeSpan = {
    type: TSTypeTypeClass;
    tail: TemplateElementTypeClass;
};

/** テンプレートリテラル型。先頭の文字列 (head) と、型とそのあとの文字列の組 (spans) に分ける */
export type TSTemplateLiteralTypeFields = TypeField<'tSTemplateLiteralType'> & {
    head: TemplateElementTypeClass;
    spans: TSTemplateLiteralTypeSpan[];
};

export class TSTemplateLiteralTypeTypeClass extends LwcCommonTypeClass<
    'tSTemplateLiteralType',
    TSTemplateLiteralTypeFields
> {
    private constructor(value: FieldsOf<TSTemplateLiteralTypeFields>, sourceSpan: SourceSpan) {
        super('tSTemplateLiteralType', value, sourceSpan);
    }

    static create(
        target: TSTemplateLiteralType,
        originalSource: string,
    ): TSTemplateLiteralTypeTypeClass {
        const [head, ...tails] = target.quasis;
        if (head == null || tails.length !== target.types.length) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'テンプレートリテラル型の quasis は types より 1 個多くなければなりません',
            );
        }
        return new TSTemplateLiteralTypeTypeClass(
            {
                head: TemplateElementTypeClass.create(head, originalSource),
                spans: target.types.map((type, index) => ({
                    type: visitNode(
                        type,
                        originalSource,
                        tSTypeVisitorEvaluatePairs(),
                        'TSTypeVisitor',
                    ),
                    tail: TemplateElementTypeClass.create(tails[index]!, originalSource),
                })),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getHead(): TSTemplateLiteralTypeFields['head'] {
        return this.getFields().head;
    }

    getSpans(): TSTemplateLiteralTypeFields['spans'] {
        return this.getFields().spans;
    }
}

export const tSTemplateLiteralTypeTypePair: EvaluatePair<
    TSTemplateLiteralType,
    TSTemplateLiteralTypeTypeClass
> = makeEvaluatePair(isTSTemplateLiteralType, (target, originalSource) =>
    TSTemplateLiteralTypeTypeClass.create(target, originalSource),
);

export const isTSTemplateLiteralTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTemplateLiteralTypeTypeClass => target instanceof TSTemplateLiteralTypeTypeClass;
