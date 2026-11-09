import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isFunctionDeclaration, type FunctionDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
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

const functionDeclarationReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const functionDeclarationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

/**
 * 名前のない関数の宣言を書けるのは export default だけなので、id は既定で null にしない。
 * export default の側では FunctionDeclarationTypeClass<IdentifierTypeClass | null> を使う
 */
export type FunctionDeclarationFields<
    TId extends IdentifierTypeClass | null = IdentifierTypeClass,
> = TypeField<'functionDeclaration'> & {
    params: FunctionParameterTypeClass[];
    generator: FunctionDeclaration['generator'];
    async: FunctionDeclaration['async'];
    id: TId;
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    typeParameters: TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass | null;
    body: BlockStatementTypeClass;
    predicate: FlowPredicateTypeClass | null;
};

export class FunctionDeclarationTypeClass<
    TId extends IdentifierTypeClass | null = IdentifierTypeClass,
> extends LwcCommonTypeClass<'functionDeclaration', FunctionDeclarationFields<TId>> {
    private constructor(value: FieldsOf<FunctionDeclarationFields<TId>>, sourceSpan: SourceSpan) {
        super('functionDeclaration', value, sourceSpan);
    }

    /** 名前のある関数の宣言 (export default のほか)。名前がなければ IrBuildError */
    static create(
        target: FunctionDeclaration,
        originalSource: string,
    ): FunctionDeclarationTypeClass {
        if (target.id == null) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                '名前のない関数の宣言は export default でしか書けません',
            );
        }
        return FunctionDeclarationTypeClass.build(
            target,
            IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    /** export default の関数の宣言 (名前を省略できる) */
    static createDefaultExport(
        target: FunctionDeclaration,
        originalSource: string,
    ): FunctionDeclarationTypeClass<IdentifierTypeClass | null> {
        return FunctionDeclarationTypeClass.build(
            target,
            target.id == null ? null : IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    private static build<TId extends IdentifierTypeClass | null>(
        target: FunctionDeclaration,
        id: TId,
        originalSource: string,
    ): FunctionDeclarationTypeClass<TId> {
        return new FunctionDeclarationTypeClass<TId>(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    functionParameterVisitorEvaluatePairs(),
                    'FunctionParameterVisitor',
                ),
                generator: target.generator,
                async: target.async,
                id,
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

    getParams(): FunctionDeclarationFields<TId>['params'] {
        return this.getFields().params;
    }

    getGenerator(): FunctionDeclarationFields<TId>['generator'] {
        return this.getFields().generator;
    }

    getAsync(): FunctionDeclarationFields<TId>['async'] {
        return this.getFields().async;
    }

    getId(): FunctionDeclarationFields<TId>['id'] {
        return this.getFields().id;
    }

    getReturnType(): FunctionDeclarationFields<TId>['returnType'] {
        return this.getFields().returnType;
    }

    getTypeParameters(): FunctionDeclarationFields<TId>['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getBody(): FunctionDeclarationFields<TId>['body'] {
        return this.getFields().body;
    }

    getPredicate(): FunctionDeclarationFields<TId>['predicate'] {
        return this.getFields().predicate;
    }
}

export const functionDeclarationTypePair: EvaluatePair<
    FunctionDeclaration,
    FunctionDeclarationTypeClass
> = makeEvaluatePair(isFunctionDeclaration, (target, originalSource) =>
    FunctionDeclarationTypeClass.create(target, originalSource),
);

export const isFunctionDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FunctionDeclarationTypeClass<IdentifierTypeClass | null> =>
    target instanceof FunctionDeclarationTypeClass;
