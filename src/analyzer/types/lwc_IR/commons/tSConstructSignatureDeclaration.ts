import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isTSConstructSignatureDeclaration,
    type TSConstructSignatureDeclaration,
} from '@babel/types';
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

const tSConstructSignatureDeclarationParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);

export type TSConstructSignatureDeclarationFields = TypeField<'tSConstructSignatureDeclaration'> & {
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    params: (
        ArrayPatternTypeClass | IdentifierTypeClass | ObjectPatternTypeClass | RestElementTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | null;
};

export class TSConstructSignatureDeclarationTypeClass extends LwcCommonTypeClass<
    'tSConstructSignatureDeclaration',
    TSConstructSignatureDeclarationFields
> {
    private constructor(
        value: FieldsOf<TSConstructSignatureDeclarationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('tSConstructSignatureDeclaration', value, sourceSpan);
    }

    static create(
        target: TSConstructSignatureDeclaration,
        originalSource: string,
    ): TSConstructSignatureDeclarationTypeClass {
        return new TSConstructSignatureDeclarationTypeClass(
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
                    tSConstructSignatureDeclarationParamsPairs(),
                    'TSConstructSignatureDeclaration.params',
                ),
                returnType:
                    target.returnType == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.returnType, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameters(): TSConstructSignatureDeclarationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getParams(): TSConstructSignatureDeclarationFields['params'] {
        return this.getFields().params;
    }

    getReturnType(): TSConstructSignatureDeclarationFields['returnType'] {
        return this.getFields().returnType;
    }
}

export const tSConstructSignatureDeclarationTypePair: EvaluatePair<
    TSConstructSignatureDeclaration,
    TSConstructSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSConstructSignatureDeclaration, (target, originalSource) =>
    TSConstructSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSConstructSignatureDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSConstructSignatureDeclarationTypeClass =>
    target instanceof TSConstructSignatureDeclarationTypeClass;
