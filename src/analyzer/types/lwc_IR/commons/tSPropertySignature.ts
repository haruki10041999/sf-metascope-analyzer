import { isTSPropertySignature, type TSPropertySignature } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';

const tSPropertySignatureTypeAnnotationPairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSPropertySignatureFields = {
    key: ExpressionTypeClass | LwcErrorTypeClass;
    computed: TSPropertySignature['computed'];
    optional: NonNullable<TSPropertySignature['optional']> | null;
    readonly: NonNullable<TSPropertySignature['readonly']> | null;
    typeAnnotation: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    kind: NonNullable<TSPropertySignature['kind']> | null;
};

export class TSPropertySignatureTypeClass extends LwcCommonTypeClass<'tSPropertySignature'> {
    private readonly value: TSPropertySignatureFields;

    private constructor(value: TSPropertySignatureFields) {
        super('tSPropertySignature');
        this.value = value;
    }

    static create(
        target: TSPropertySignature,
        originalSource: string,
    ): TSPropertySignatureTypeClass {
        return new TSPropertySignatureTypeClass({
            key: visitNode(
                target.key,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            computed: target.computed,
            optional: target.optional ?? null,
            readonly: target.readonly ?? null,
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                tSPropertySignatureTypeAnnotationPairs(),
                'TSPropertySignature.typeAnnotation',
            ),
            kind: target.kind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSPropertySignatureFields {
        return this.value;
    }

    getKey(): TSPropertySignatureFields['key'] {
        return this.value.key;
    }

    getComputed(): TSPropertySignatureFields['computed'] {
        return this.value.computed;
    }

    getOptional(): TSPropertySignatureFields['optional'] {
        return this.value.optional;
    }

    getReadonly(): TSPropertySignatureFields['readonly'] {
        return this.value.readonly;
    }

    getTypeAnnotation(): TSPropertySignatureFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getKind(): TSPropertySignatureFields['kind'] {
        return this.value.kind;
    }
}

export const tSPropertySignatureTypePair: EvaluatePair<
    TSPropertySignature,
    TSPropertySignatureTypeClass
> = makeEvaluatePair(isTSPropertySignature, (target, originalSource) =>
    TSPropertySignatureTypeClass.create(target, originalSource),
);

export const isTSPropertySignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSPropertySignatureTypeClass => target instanceof TSPropertySignatureTypeClass;
