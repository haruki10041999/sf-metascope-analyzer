import { isTSCallSignatureDeclaration, type TSCallSignatureDeclaration } from '@babel/types';
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

const tSCallSignatureDeclarationTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSCallSignatureDeclarationParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSCallSignatureDeclarationReturnTypePairs = lazyPairs(
    () => [tSTypeAnnotationTypePair] as const,
);

export type TSCallSignatureDeclarationFields = {
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

export class TSCallSignatureDeclarationTypeClass extends LwcCommonTypeClass<'tSCallSignatureDeclaration'> {
    private readonly value: TSCallSignatureDeclarationFields;

    private constructor(value: TSCallSignatureDeclarationFields) {
        super('tSCallSignatureDeclaration');
        this.value = value;
    }

    static create(
        target: TSCallSignatureDeclaration,
        originalSource: string,
    ): TSCallSignatureDeclarationTypeClass {
        return new TSCallSignatureDeclarationTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSCallSignatureDeclarationTypeParametersPairs(),
                'TSCallSignatureDeclaration.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                tSCallSignatureDeclarationParamsPairs(),
                'TSCallSignatureDeclaration.params',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSCallSignatureDeclarationReturnTypePairs(),
                'TSCallSignatureDeclaration.returnType',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSCallSignatureDeclarationFields {
        return this.value;
    }

    getTypeParameters(): TSCallSignatureDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): TSCallSignatureDeclarationFields['params'] {
        return this.value.params;
    }

    getReturnType(): TSCallSignatureDeclarationFields['returnType'] {
        return this.value.returnType;
    }
}

export const tSCallSignatureDeclarationTypePair: EvaluatePair<
    TSCallSignatureDeclaration,
    TSCallSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSCallSignatureDeclaration, (target, originalSource) =>
    TSCallSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSCallSignatureDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSCallSignatureDeclarationTypeClass =>
    target instanceof TSCallSignatureDeclarationTypeClass;
