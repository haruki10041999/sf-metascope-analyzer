import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSCallSignatureDeclaration, type TSCallSignatureDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { TSTypeParameterDeclarationTypeClass } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { restElementTypePair, type RestElementTypeClass } from './restElement';

const tSCallSignatureDeclarationParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);

export type TSCallSignatureDeclarationFields = TypeField<'tSCallSignatureDeclaration'> & {
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    params: (
        ArrayPatternTypeClass | IdentifierTypeClass | ObjectPatternTypeClass | RestElementTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | null;
};

export class TSCallSignatureDeclarationTypeClass extends LwcCommonTypeClass<
    'tSCallSignatureDeclaration',
    TSCallSignatureDeclarationFields
> {
    private constructor(value: FieldsOf<TSCallSignatureDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSCallSignatureDeclaration', value, sourceSpan);
    }

    static create(
        target: TSCallSignatureDeclaration,
        originalSource: string,
    ): TSCallSignatureDeclarationTypeClass {
        return new TSCallSignatureDeclarationTypeClass(
            {
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TSTypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                params: visitNodeList(
                    target.params,
                    originalSource,
                    tSCallSignatureDeclarationParamsPairs(),
                    'TSCallSignatureDeclaration.params',
                ),
                returnType:
                    target.returnType == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.returnType, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameters(): TSCallSignatureDeclarationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getParams(): TSCallSignatureDeclarationFields['params'] {
        return this.getFields().params;
    }

    getReturnType(): TSCallSignatureDeclarationFields['returnType'] {
        return this.getFields().returnType;
    }
}

export const tSCallSignatureDeclarationTypePair: EvaluatePair<
    TSCallSignatureDeclaration,
    TSCallSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSCallSignatureDeclaration, (target, originalSource) =>
    TSCallSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSCallSignatureDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSCallSignatureDeclarationTypeClass =>
    target instanceof TSCallSignatureDeclarationTypeClass;
