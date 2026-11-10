import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTaggedTemplateExpression, type TaggedTemplateExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { TemplateLiteralTypeClass } from './templateLiteral';

const taggedTemplateExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type TaggedTemplateExpressionFields = TypeField<'taggedTemplateExpression'> & {
    tag: ExpressionTypeClass;
    quasi: TemplateLiteralTypeClass;
    typeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
};

export class TaggedTemplateExpressionTypeClass extends LwcCommonTypeClass<
    'taggedTemplateExpression',
    TaggedTemplateExpressionFields
> {
    private constructor(value: FieldsOf<TaggedTemplateExpressionFields>, sourceSpan: SourceSpan) {
        super('taggedTemplateExpression', value, sourceSpan);
    }

    static create(
        target: TaggedTemplateExpression,
        originalSource: string,
    ): TaggedTemplateExpressionTypeClass {
        return new TaggedTemplateExpressionTypeClass(
            {
                tag: visitNode(
                    target.tag,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                quasi: TemplateLiteralTypeClass.create(target.quasi, originalSource),
                typeArguments: visitOptionalNode(
                    target.typeArguments,
                    originalSource,
                    taggedTemplateExpressionTypeArgumentsPairs(),
                    'TaggedTemplateExpression.typeArguments',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTag(): TaggedTemplateExpressionFields['tag'] {
        return this.getFields().tag;
    }

    getQuasi(): TaggedTemplateExpressionFields['quasi'] {
        return this.getFields().quasi;
    }

    getTypeArguments(): TaggedTemplateExpressionFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const taggedTemplateExpressionTypePair: EvaluatePair<
    TaggedTemplateExpression,
    TaggedTemplateExpressionTypeClass
> = makeEvaluatePair(isTaggedTemplateExpression, (target, originalSource) =>
    TaggedTemplateExpressionTypeClass.create(target, originalSource),
);

export const isTaggedTemplateExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TaggedTemplateExpressionTypeClass =>
    target instanceof TaggedTemplateExpressionTypeClass;
