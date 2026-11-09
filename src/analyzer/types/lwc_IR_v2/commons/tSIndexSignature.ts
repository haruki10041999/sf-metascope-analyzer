import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSIndexSignature, type TSIndexSignature } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { IdentifierTypeClass } from './identifier';

export type TSIndexSignatureFields = TypeField<'tSIndexSignature'> & {
    readonly: boolean;
    static: boolean;
    /** 引数はちょうど 1 個 (`[key: string]`) */
    parameter: IdentifierTypeClass;
    typeAnnotation: TSTypeAnnotationTypeClass | null;
};

export class TSIndexSignatureTypeClass extends LwcCommonTypeClass<
    'tSIndexSignature',
    TSIndexSignatureFields
> {
    private constructor(value: FieldsOf<TSIndexSignatureFields>, sourceSpan: SourceSpan) {
        super('tSIndexSignature', value, sourceSpan);
    }

    static create(target: TSIndexSignature, originalSource: string): TSIndexSignatureTypeClass {
        return new TSIndexSignatureTypeClass(
            {
                readonly: target.readonly ?? false,
                static: target.static ?? false,
                parameter:
                    target.parameters.length === 1 && target.parameters[0] != null
                        ? IdentifierTypeClass.create(target.parameters[0], originalSource)
                        : failIrBuild(
                              'TYPE_MISMATCH',
                              target,
                              originalSource,
                              'インデックスシグネチャの引数はちょうど 1 個です',
                          ),
                typeAnnotation:
                    target.typeAnnotation == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.typeAnnotation, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getReadonly(): TSIndexSignatureFields['readonly'] {
        return this.getFields().readonly;
    }

    getStatic(): TSIndexSignatureFields['static'] {
        return this.getFields().static;
    }

    getParameter(): TSIndexSignatureFields['parameter'] {
        return this.getFields().parameter;
    }

    getTypeAnnotation(): TSIndexSignatureFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSIndexSignatureTypePair: EvaluatePair<TSIndexSignature, TSIndexSignatureTypeClass> =
    makeEvaluatePair(isTSIndexSignature, (target, originalSource) =>
        TSIndexSignatureTypeClass.create(target, originalSource),
    );

export const isTSIndexSignatureType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSIndexSignatureTypeClass => target instanceof TSIndexSignatureTypeClass;
