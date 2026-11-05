import { isTSIndexSignature, type TSIndexSignature } from '@babel/types';
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
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSIndexSignatureParametersPairs = lazyPairs(() => [identifierTypePair] as const);
const tSIndexSignatureTypeAnnotationPairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSIndexSignatureFields = {
    readonly: NonNullable<TSIndexSignature['readonly']> | null;
    static: NonNullable<TSIndexSignature['static']> | null;
    parameters: (IdentifierTypeClass | LwcErrorTypeClass)[];
    typeAnnotation: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
};

export class TSIndexSignatureTypeClass extends LwcCommonTypeClass<'tSIndexSignature'> {
    private readonly value: TSIndexSignatureFields;

    private constructor(value: TSIndexSignatureFields) {
        super('tSIndexSignature');
        this.value = value;
    }

    static create(target: TSIndexSignature, originalSource: string): TSIndexSignatureTypeClass {
        return new TSIndexSignatureTypeClass({
            readonly: target.readonly ?? null,
            static: target.static ?? null,
            parameters: visitNodeList(
                target.parameters,
                originalSource,
                tSIndexSignatureParametersPairs(),
                'TSIndexSignature.parameters',
            ),
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                tSIndexSignatureTypeAnnotationPairs(),
                'TSIndexSignature.typeAnnotation',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSIndexSignatureFields {
        return this.value;
    }

    getReadonly(): TSIndexSignatureFields['readonly'] {
        return this.value.readonly;
    }

    getStatic(): TSIndexSignatureFields['static'] {
        return this.value.static;
    }

    getParameters(): TSIndexSignatureFields['parameters'] {
        return this.value.parameters;
    }

    getTypeAnnotation(): TSIndexSignatureFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSIndexSignatureTypePair: EvaluatePair<TSIndexSignature, TSIndexSignatureTypeClass> =
    makeEvaluatePair(isTSIndexSignature, (target, originalSource) =>
        TSIndexSignatureTypeClass.create(target, originalSource),
    );

export const isTSIndexSignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSIndexSignatureTypeClass => target instanceof TSIndexSignatureTypeClass;
