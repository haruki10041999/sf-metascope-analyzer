import { isFunctionDeclaration, type FunctionDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
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
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const functionDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const functionDeclarationReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const functionDeclarationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const functionDeclarationBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type FunctionDeclarationFields = {
    params: (FunctionParameterTypeClass | LwcErrorTypeClass)[];
    generator: FunctionDeclaration['generator'];
    async: FunctionDeclaration['async'];
    declare: NonNullable<FunctionDeclaration['declare']> | null;
    id: IdentifierTypeClass | LwcErrorTypeClass | null;
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
    predicate: FlowPredicateTypeClass | LwcErrorTypeClass | null;
};

export class FunctionDeclarationTypeClass extends LwcCommonTypeClass<'functionDeclaration'> {
    private readonly value: FunctionDeclarationFields;

    private constructor(value: FunctionDeclarationFields) {
        super('functionDeclaration');
        this.value = value;
    }

    static create(
        target: FunctionDeclaration,
        originalSource: string,
    ): FunctionDeclarationTypeClass {
        return new FunctionDeclarationTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                functionParameterVisitorEvaluatePairs(),
                'FunctionParameterVisitor',
            ),
            generator: target.generator,
            async: target.async,
            declare: target.declare ?? null,
            id: visitOptionalNode(
                target.id,
                originalSource,
                functionDeclarationIdPairs(),
                'FunctionDeclaration.id',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                functionDeclarationReturnTypePairs(),
                'FunctionDeclaration.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                functionDeclarationTypeParametersPairs(),
                'FunctionDeclaration.typeParameters',
            ),
            body: visitNode(
                target.body,
                originalSource,
                functionDeclarationBodyPairs(),
                'FunctionDeclaration.body',
            ),
            predicate: visitOptionalNode(
                target.predicate,
                originalSource,
                flowPredicateVisitorEvaluatePairs(),
                'FlowPredicateVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): FunctionDeclarationFields {
        return this.value;
    }

    getParams(): FunctionDeclarationFields['params'] {
        return this.value.params;
    }

    getGenerator(): FunctionDeclarationFields['generator'] {
        return this.value.generator;
    }

    getAsync(): FunctionDeclarationFields['async'] {
        return this.value.async;
    }

    getDeclare(): FunctionDeclarationFields['declare'] {
        return this.value.declare;
    }

    getId(): FunctionDeclarationFields['id'] {
        return this.value.id;
    }

    getReturnType(): FunctionDeclarationFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): FunctionDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getBody(): FunctionDeclarationFields['body'] {
        return this.value.body;
    }

    getPredicate(): FunctionDeclarationFields['predicate'] {
        return this.value.predicate;
    }
}

export const functionDeclarationTypePair: EvaluatePair<
    FunctionDeclaration,
    FunctionDeclarationTypeClass
> = makeEvaluatePair(isFunctionDeclaration, (target, originalSource) =>
    FunctionDeclarationTypeClass.create(target, originalSource),
);

export const isFunctionDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionDeclarationTypeClass => target instanceof FunctionDeclarationTypeClass;
