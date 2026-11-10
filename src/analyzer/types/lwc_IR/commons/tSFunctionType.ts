import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSFunctionType, type TSFunctionType } from '@babel/types';
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

const tSFunctionTypeParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);

export type TSFunctionTypeFields = TypeField<'tSFunctionType'> & {
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    params: (
        ArrayPatternTypeClass | IdentifierTypeClass | ObjectPatternTypeClass | RestElementTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | null;
};

export class TSFunctionTypeTypeClass extends LwcCommonTypeClass<
    'tSFunctionType',
    TSFunctionTypeFields
> {
    private constructor(value: FieldsOf<TSFunctionTypeFields>, sourceSpan: SourceSpan) {
        super('tSFunctionType', value, sourceSpan);
    }

    static create(target: TSFunctionType, originalSource: string): TSFunctionTypeTypeClass {
        return new TSFunctionTypeTypeClass(
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
                    tSFunctionTypeParamsPairs(),
                    'TSFunctionType.params',
                ),
                returnType:
                    target.returnType == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.returnType, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameters(): TSFunctionTypeFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getParams(): TSFunctionTypeFields['params'] {
        return this.getFields().params;
    }

    getReturnType(): TSFunctionTypeFields['returnType'] {
        return this.getFields().returnType;
    }
}

export const tSFunctionTypeTypePair: EvaluatePair<TSFunctionType, TSFunctionTypeTypeClass> =
    makeEvaluatePair(isTSFunctionType, (target, originalSource) =>
        TSFunctionTypeTypeClass.create(target, originalSource),
    );

export const isTSFunctionTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSFunctionTypeTypeClass => target instanceof TSFunctionTypeTypeClass;
