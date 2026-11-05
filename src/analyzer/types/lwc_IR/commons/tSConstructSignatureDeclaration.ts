import {
    isTSConstructSignatureDeclaration,
    type TSConstructSignatureDeclaration,
} from '@babel/types';
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

const tSConstructSignatureDeclarationTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSConstructSignatureDeclarationParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSConstructSignatureDeclarationReturnTypePairs = lazyPairs(
    () => [tSTypeAnnotationTypePair] as const,
);

export type TSConstructSignatureDeclarationFields = {
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

export class TSConstructSignatureDeclarationTypeClass extends LwcCommonTypeClass<'tSConstructSignatureDeclaration'> {
    private readonly value: TSConstructSignatureDeclarationFields;

    private constructor(value: TSConstructSignatureDeclarationFields) {
        super('tSConstructSignatureDeclaration');
        this.value = value;
    }

    static create(
        target: TSConstructSignatureDeclaration,
        originalSource: string,
    ): TSConstructSignatureDeclarationTypeClass {
        return new TSConstructSignatureDeclarationTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSConstructSignatureDeclarationTypeParametersPairs(),
                'TSConstructSignatureDeclaration.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                tSConstructSignatureDeclarationParamsPairs(),
                'TSConstructSignatureDeclaration.params',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSConstructSignatureDeclarationReturnTypePairs(),
                'TSConstructSignatureDeclaration.returnType',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSConstructSignatureDeclarationFields {
        return this.value;
    }

    getTypeParameters(): TSConstructSignatureDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): TSConstructSignatureDeclarationFields['params'] {
        return this.value.params;
    }

    getReturnType(): TSConstructSignatureDeclarationFields['returnType'] {
        return this.value.returnType;
    }
}

export const tSConstructSignatureDeclarationTypePair: EvaluatePair<
    TSConstructSignatureDeclaration,
    TSConstructSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSConstructSignatureDeclaration, (target, originalSource) =>
    TSConstructSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSConstructSignatureDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSConstructSignatureDeclarationTypeClass =>
    target instanceof TSConstructSignatureDeclarationTypeClass;
