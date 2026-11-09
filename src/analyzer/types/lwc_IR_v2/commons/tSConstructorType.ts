import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSConstructorType, type TSConstructorType } from '@babel/types';
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

const tSConstructorTypeParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);

export type TSConstructorTypeFields = TypeField<'tSConstructorType'> & {
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    params: (
        ArrayPatternTypeClass | IdentifierTypeClass | ObjectPatternTypeClass | RestElementTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | null;
    abstract: boolean;
};

export class TSConstructorTypeTypeClass extends LwcCommonTypeClass<
    'tSConstructorType',
    TSConstructorTypeFields
> {
    private constructor(value: FieldsOf<TSConstructorTypeFields>, sourceSpan: SourceSpan) {
        super('tSConstructorType', value, sourceSpan);
    }

    static create(target: TSConstructorType, originalSource: string): TSConstructorTypeTypeClass {
        return new TSConstructorTypeTypeClass(
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
                    tSConstructorTypeParamsPairs(),
                    'TSConstructorType.params',
                ),
                returnType:
                    target.returnType == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.returnType, originalSource),
                abstract: target.abstract ?? false,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameters(): TSConstructorTypeFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getParams(): TSConstructorTypeFields['params'] {
        return this.getFields().params;
    }

    getReturnType(): TSConstructorTypeFields['returnType'] {
        return this.getFields().returnType;
    }

    getAbstract(): TSConstructorTypeFields['abstract'] {
        return this.getFields().abstract;
    }
}

export const tSConstructorTypeTypePair: EvaluatePair<
    TSConstructorType,
    TSConstructorTypeTypeClass
> = makeEvaluatePair(isTSConstructorType, (target, originalSource) =>
    TSConstructorTypeTypeClass.create(target, originalSource),
);

export const isTSConstructorTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSConstructorTypeTypeClass => target instanceof TSConstructorTypeTypeClass;
