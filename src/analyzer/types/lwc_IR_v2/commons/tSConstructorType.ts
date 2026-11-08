import { isTSConstructorType, type TSConstructorType } from '@babel/types';
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

const tSConstructorTypeTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSConstructorTypeParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSConstructorTypeReturnTypePairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSConstructorTypeFields = {
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    params: (
        | ArrayPatternTypeClass
        | IdentifierTypeClass
        | ObjectPatternTypeClass
        | RestElementTypeClass
        | LwcErrorTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    abstract: NonNullable<TSConstructorType['abstract']> | null;
};

export class TSConstructorTypeTypeClass extends LwcCommonTypeClass<'tSConstructorType'> {
    private readonly value: TSConstructorTypeFields;

    private constructor(value: TSConstructorTypeFields) {
        super('tSConstructorType');
        this.value = value;
    }

    static create(target: TSConstructorType, originalSource: string): TSConstructorTypeTypeClass {
        return new TSConstructorTypeTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSConstructorTypeTypeParametersPairs(),
                'TSConstructorType.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                tSConstructorTypeParamsPairs(),
                'TSConstructorType.params',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSConstructorTypeReturnTypePairs(),
                'TSConstructorType.returnType',
            ),
            abstract: target.abstract ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSConstructorTypeFields {
        return this.value;
    }

    getTypeParameters(): TSConstructorTypeFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): TSConstructorTypeFields['params'] {
        return this.value.params;
    }

    getReturnType(): TSConstructorTypeFields['returnType'] {
        return this.value.returnType;
    }

    getAbstract(): TSConstructorTypeFields['abstract'] {
        return this.value.abstract;
    }
}

export const tSConstructorTypeTypePair: EvaluatePair<
    TSConstructorType,
    TSConstructorTypeTypeClass
> = makeEvaluatePair(isTSConstructorType, (target, originalSource) =>
    TSConstructorTypeTypeClass.create(target, originalSource),
);

export const isTSConstructorTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSConstructorTypeTypeClass => target instanceof TSConstructorTypeTypeClass;
