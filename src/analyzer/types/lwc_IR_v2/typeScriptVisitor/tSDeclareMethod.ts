import { isTSDeclareMethod, type TSDeclareMethod } from '@babel/types';
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
import { privateNameTypePair, type PrivateNameTypeClass } from '../commons/privateName';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSParameterPropertyTypePair,
    type TSParameterPropertyTypeClass,
} from './tSParameterProperty';
import { tSTypeAnnotationTypePair, type TSTypeAnnotationTypeClass } from './tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from './tSTypeParameterDeclaration';

const tSDeclareMethodParamsPairs = lazyPairs(
    () => [...functionParameterVisitorEvaluatePairs(), tSParameterPropertyTypePair] as const,
);
const tSDeclareMethodKeyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);
const tSDeclareMethodReturnTypePairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);
const tSDeclareMethodTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);

export type TSDeclareMethodFields = {
    params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass | LwcErrorTypeClass)[];
    generator: TSDeclareMethod['generator'];
    async: TSDeclareMethod['async'];
    abstract: NonNullable<TSDeclareMethod['abstract']> | null;
    accessibility: NonNullable<TSDeclareMethod['accessibility']> | null;
    static: TSDeclareMethod['static'];
    override: NonNullable<TSDeclareMethod['override']> | null;
    computed: TSDeclareMethod['computed'];
    optional: NonNullable<TSDeclareMethod['optional']> | null;
    key: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    kind: TSDeclareMethod['kind'];
    access: NonNullable<TSDeclareMethod['access']> | null;
    returnType: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
};

export class TSDeclareMethodTypeClass extends LwcCommonTypeClass<'tSDeclareMethod'> {
    private readonly value: TSDeclareMethodFields;

    private constructor(value: TSDeclareMethodFields) {
        super('tSDeclareMethod');
        this.value = value;
    }

    static create(target: TSDeclareMethod, originalSource: string): TSDeclareMethodTypeClass {
        return new TSDeclareMethodTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                tSDeclareMethodParamsPairs(),
                'TSDeclareMethod.params',
            ),
            generator: target.generator,
            async: target.async,
            abstract: target.abstract ?? null,
            accessibility: target.accessibility ?? null,
            static: target.static,
            override: target.override ?? null,
            computed: target.computed,
            optional: target.optional ?? null,
            key: visitNode(
                target.key,
                originalSource,
                tSDeclareMethodKeyPairs(),
                'TSDeclareMethod.key',
            ),
            kind: target.kind,
            access: target.access ?? null,
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSDeclareMethodReturnTypePairs(),
                'TSDeclareMethod.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSDeclareMethodTypeParametersPairs(),
                'TSDeclareMethod.typeParameters',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSDeclareMethodFields {
        return this.value;
    }

    getParams(): TSDeclareMethodFields['params'] {
        return this.value.params;
    }

    getGenerator(): TSDeclareMethodFields['generator'] {
        return this.value.generator;
    }

    getAsync(): TSDeclareMethodFields['async'] {
        return this.value.async;
    }

    getAbstract(): TSDeclareMethodFields['abstract'] {
        return this.value.abstract;
    }

    getAccessibility(): TSDeclareMethodFields['accessibility'] {
        return this.value.accessibility;
    }

    getStatic(): TSDeclareMethodFields['static'] {
        return this.value.static;
    }

    getOverride(): TSDeclareMethodFields['override'] {
        return this.value.override;
    }

    getComputed(): TSDeclareMethodFields['computed'] {
        return this.value.computed;
    }

    getOptional(): TSDeclareMethodFields['optional'] {
        return this.value.optional;
    }

    getKey(): TSDeclareMethodFields['key'] {
        return this.value.key;
    }

    getKind(): TSDeclareMethodFields['kind'] {
        return this.value.kind;
    }

    getAccess(): TSDeclareMethodFields['access'] {
        return this.value.access;
    }

    getReturnType(): TSDeclareMethodFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): TSDeclareMethodFields['typeParameters'] {
        return this.value.typeParameters;
    }
}

export const tSDeclareMethodTypePair: EvaluatePair<TSDeclareMethod, TSDeclareMethodTypeClass> =
    makeEvaluatePair(isTSDeclareMethod, (target, originalSource) =>
        TSDeclareMethodTypeClass.create(target, originalSource),
    );

export const isTSDeclareMethodType = (
    target: LwcCommonTypeClass<string>,
): target is TSDeclareMethodTypeClass => target instanceof TSDeclareMethodTypeClass;
