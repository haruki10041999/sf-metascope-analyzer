import { isTSFunctionType, type TSFunctionType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { restElementTypePair, type RestElementTypeClass } from './restElement';

const tSFunctionTypeTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSFunctionTypeParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSFunctionTypeReturnTypePairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSFunctionTypeFields = {
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    params: (
        | ArrayPatternTypeClass
        | IdentifierTypeClass
        | ObjectPatternTypeClass
        | RestElementTypeClass
        | LwcErrorTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
};

export class TSFunctionTypeTypeClass extends LwcCommonTypeClass<'tSFunctionType'> {
    private readonly value: TSFunctionTypeFields;

    private constructor(value: TSFunctionTypeFields) {
        super('tSFunctionType');
        this.value = value;
    }

    static create(target: TSFunctionType, originalSource: string): TSFunctionTypeTypeClass {
        return new TSFunctionTypeTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSFunctionTypeTypeParametersPairs(),
                'TSFunctionType.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                tSFunctionTypeParamsPairs(),
                'TSFunctionType.params',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSFunctionTypeReturnTypePairs(),
                'TSFunctionType.returnType',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSFunctionTypeFields {
        return this.value;
    }

    getTypeParameters(): TSFunctionTypeFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): TSFunctionTypeFields['params'] {
        return this.value.params;
    }

    getReturnType(): TSFunctionTypeFields['returnType'] {
        return this.value.returnType;
    }
}

export const tSFunctionTypeTypePair: EvaluatePair<TSFunctionType, TSFunctionTypeTypeClass> =
    makeEvaluatePair(isTSFunctionType, (target, originalSource) =>
        TSFunctionTypeTypeClass.create(target, originalSource),
    );

export const isTSFunctionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSFunctionTypeTypeClass => target instanceof TSFunctionTypeTypeClass;
