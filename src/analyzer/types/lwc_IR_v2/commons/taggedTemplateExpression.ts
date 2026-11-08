import { isTaggedTemplateExpression, type TaggedTemplateExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
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
import { templateLiteralTypePair, type TemplateLiteralTypeClass } from './templateLiteral';

const taggedTemplateExpressionQuasiPairs = lazyPairs(() => [templateLiteralTypePair] as const);
const taggedTemplateExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type TaggedTemplateExpressionFields = {
    tag: ExpressionTypeClass | LwcErrorTypeClass;
    quasi: TemplateLiteralTypeClass | LwcErrorTypeClass;
    typeArguments:
        | TypeParameterInstantiationTypeClass
        | TSTypeParameterInstantiationTypeClass
        | LwcErrorTypeClass
        | null;
};

export class TaggedTemplateExpressionTypeClass extends LwcCommonTypeClass<'taggedTemplateExpression'> {
    private readonly value: TaggedTemplateExpressionFields;

    private constructor(value: TaggedTemplateExpressionFields) {
        super('taggedTemplateExpression');
        this.value = value;
    }

    static create(
        target: TaggedTemplateExpression,
        originalSource: string,
    ): TaggedTemplateExpressionTypeClass {
        return new TaggedTemplateExpressionTypeClass({
            tag: visitNode(
                target.tag,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            quasi: visitNode(
                target.quasi,
                originalSource,
                taggedTemplateExpressionQuasiPairs(),
                'TaggedTemplateExpression.quasi',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                taggedTemplateExpressionTypeArgumentsPairs(),
                'TaggedTemplateExpression.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TaggedTemplateExpressionFields {
        return this.value;
    }

    getTag(): TaggedTemplateExpressionFields['tag'] {
        return this.value.tag;
    }

    getQuasi(): TaggedTemplateExpressionFields['quasi'] {
        return this.value.quasi;
    }

    getTypeArguments(): TaggedTemplateExpressionFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const taggedTemplateExpressionTypePair: EvaluatePair<
    TaggedTemplateExpression,
    TaggedTemplateExpressionTypeClass
> = makeEvaluatePair(isTaggedTemplateExpression, (target, originalSource) =>
    TaggedTemplateExpressionTypeClass.create(target, originalSource),
);

export const isTaggedTemplateExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TaggedTemplateExpressionTypeClass =>
    target instanceof TaggedTemplateExpressionTypeClass;
