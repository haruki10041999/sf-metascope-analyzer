import { isTSMethodSignature, type TSMethodSignature } from '@babel/types';
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
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
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

const tSMethodSignatureTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSMethodSignatureParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSMethodSignatureReturnTypePairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSMethodSignatureFields = {
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    params: (
        | ArrayPatternTypeClass
        | IdentifierTypeClass
        | ObjectPatternTypeClass
        | RestElementTypeClass
        | LwcErrorTypeClass
    )[];
    returnType: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    key: ExpressionTypeClass | LwcErrorTypeClass;
    computed: TSMethodSignature['computed'];
    optional: NonNullable<TSMethodSignature['optional']> | null;
    kind: TSMethodSignature['kind'];
};

export class TSMethodSignatureTypeClass extends LwcCommonTypeClass<'tSMethodSignature'> {
    private readonly value: TSMethodSignatureFields;

    private constructor(value: TSMethodSignatureFields) {
        super('tSMethodSignature');
        this.value = value;
    }

    static create(target: TSMethodSignature, originalSource: string): TSMethodSignatureTypeClass {
        return new TSMethodSignatureTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSMethodSignatureTypeParametersPairs(),
                'TSMethodSignature.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                tSMethodSignatureParamsPairs(),
                'TSMethodSignature.params',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSMethodSignatureReturnTypePairs(),
                'TSMethodSignature.returnType',
            ),
            key: visitNode(
                target.key,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            computed: target.computed,
            optional: target.optional ?? null,
            kind: target.kind,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSMethodSignatureFields {
        return this.value;
    }

    getTypeParameters(): TSMethodSignatureFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): TSMethodSignatureFields['params'] {
        return this.value.params;
    }

    getReturnType(): TSMethodSignatureFields['returnType'] {
        return this.value.returnType;
    }

    getKey(): TSMethodSignatureFields['key'] {
        return this.value.key;
    }

    getComputed(): TSMethodSignatureFields['computed'] {
        return this.value.computed;
    }

    getOptional(): TSMethodSignatureFields['optional'] {
        return this.value.optional;
    }

    getKind(): TSMethodSignatureFields['kind'] {
        return this.value.kind;
    }
}

export const tSMethodSignatureTypePair: EvaluatePair<
    TSMethodSignature,
    TSMethodSignatureTypeClass
> = makeEvaluatePair(isTSMethodSignature, (target, originalSource) =>
    TSMethodSignatureTypeClass.create(target, originalSource),
);

export const isTSMethodSignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSMethodSignatureTypeClass => target instanceof TSMethodSignatureTypeClass;
