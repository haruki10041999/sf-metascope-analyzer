import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSPropertySignature, type TSPropertySignature } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { createMemberKey, staticMemberKeyPairs, type MemberKey } from './memberKey';

/**
 * key は computed で見分ける。Babel の kind (get・set) は非推奨で、Babel 8 の get・set は TSMethodSignature になるので持たない
 */
export type TSPropertySignatureFields = TypeField<'tSPropertySignature'> &
    MemberKey & {
        optional: boolean;
        readonly: boolean;
        typeAnnotation: TSTypeAnnotationTypeClass | null;
    };

export class TSPropertySignatureTypeClass extends LwcCommonTypeClass<
    'tSPropertySignature',
    TSPropertySignatureFields
> {
    private constructor(value: FieldsOf<TSPropertySignatureFields>, sourceSpan: SourceSpan) {
        super('tSPropertySignature', value, sourceSpan);
    }

    static create(
        target: TSPropertySignature,
        originalSource: string,
    ): TSPropertySignatureTypeClass {
        return new TSPropertySignatureTypeClass(
            {
                ...createMemberKey(
                    target,
                    originalSource,
                    staticMemberKeyPairs(),
                    'TSPropertySignature',
                ),
                optional: target.optional ?? false,
                readonly: target.readonly ?? false,
                typeAnnotation:
                    target.typeAnnotation == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.typeAnnotation, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKey(): TSPropertySignatureFields['key'] {
        return this.getFields().key;
    }

    getComputed(): TSPropertySignatureFields['computed'] {
        return this.getFields().computed;
    }

    getOptional(): TSPropertySignatureFields['optional'] {
        return this.getFields().optional;
    }

    getReadonly(): TSPropertySignatureFields['readonly'] {
        return this.getFields().readonly;
    }

    getTypeAnnotation(): TSPropertySignatureFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSPropertySignatureTypePair: EvaluatePair<
    TSPropertySignature,
    TSPropertySignatureTypeClass
> = makeEvaluatePair(isTSPropertySignature, (target, originalSource) =>
    TSPropertySignatureTypeClass.create(target, originalSource),
);

export const isTSPropertySignatureType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSPropertySignatureTypeClass => target instanceof TSPropertySignatureTypeClass;
