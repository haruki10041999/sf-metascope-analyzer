import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isFunctionExpression, type FunctionExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    flowPredicateVisitorEvaluatePairs,
    type FlowPredicateTypeClass,
} from '../flowPredicateVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { BlockStatementTypeClass } from './blockStatement';
import { IdentifierTypeClass } from './identifier';

const functionExpressionReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const functionExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

export type FunctionExpressionFields = TypeField<'functionExpression'> & {
    params: FunctionParameterTypeClass[];
    generator: FunctionExpression['generator'];
    async: FunctionExpression['async'];
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    typeParameters: TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass | null;
    id: IdentifierTypeClass | null;
    body: BlockStatementTypeClass;
    predicate: FlowPredicateTypeClass | null;
};

export class FunctionExpressionTypeClass extends LwcCommonTypeClass<
    'functionExpression',
    FunctionExpressionFields
> {
    private constructor(value: FieldsOf<FunctionExpressionFields>, sourceSpan: SourceSpan) {
        super('functionExpression', value, sourceSpan);
    }

    static create(target: FunctionExpression, originalSource: string): FunctionExpressionTypeClass {
        return new FunctionExpressionTypeClass(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    functionParameterVisitorEvaluatePairs(),
                    'FunctionParameterVisitor',
                ),
                generator: target.generator,
                async: target.async,
                returnType: visitOptionalNode(
                    target.returnType,
                    originalSource,
                    functionExpressionReturnTypePairs(),
                    'FunctionExpression.returnType',
                ),
                typeParameters: visitOptionalNode(
                    target.typeParameters,
                    originalSource,
                    functionExpressionTypeParametersPairs(),
                    'FunctionExpression.typeParameters',
                ),
                id:
                    target.id == null
                        ? null
                        : IdentifierTypeClass.create(target.id, originalSource),
                body: BlockStatementTypeClass.create(target.body, originalSource),
                predicate: visitOptionalNode(
                    target.predicate,
                    originalSource,
                    flowPredicateVisitorEvaluatePairs(),
                    'FlowPredicateVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): FunctionExpressionFields['params'] {
        return this.getFields().params;
    }

    getGenerator(): FunctionExpressionFields['generator'] {
        return this.getFields().generator;
    }

    getAsync(): FunctionExpressionFields['async'] {
        return this.getFields().async;
    }

    getReturnType(): FunctionExpressionFields['returnType'] {
        return this.getFields().returnType;
    }

    getTypeParameters(): FunctionExpressionFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getId(): FunctionExpressionFields['id'] {
        return this.getFields().id;
    }

    getBody(): FunctionExpressionFields['body'] {
        return this.getFields().body;
    }

    getPredicate(): FunctionExpressionFields['predicate'] {
        return this.getFields().predicate;
    }
}

export const functionExpressionTypePair: EvaluatePair<
    FunctionExpression,
    FunctionExpressionTypeClass
> = makeEvaluatePair(isFunctionExpression, (target, originalSource) =>
    FunctionExpressionTypeClass.create(target, originalSource),
);

export const isFunctionExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FunctionExpressionTypeClass => target instanceof FunctionExpressionTypeClass;
