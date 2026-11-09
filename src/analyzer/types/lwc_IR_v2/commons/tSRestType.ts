import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSRestType, type TSRestType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { tSNamedTupleMemberTypePair, type TSNamedTupleMemberTypeClass } from './tSNamedTupleMember';

const tSRestTypeTypeAnnotationPairs = lazyPairs(
    () => [...tSTypeVisitorEvaluatePairs(), tSNamedTupleMemberTypePair] as const,
);

/** タプルの rest の要素。ラベル付き (`...rest: T[]`) のときは TSNamedTupleMember を包む */
export type TSRestTypeFields = TypeField<'tSRestType'> & {
    typeAnnotation: TSTypeTypeClass | TSNamedTupleMemberTypeClass;
};

export class TSRestTypeTypeClass extends LwcCommonTypeClass<'tSRestType', TSRestTypeFields> {
    private constructor(value: FieldsOf<TSRestTypeFields>, sourceSpan: SourceSpan) {
        super('tSRestType', value, sourceSpan);
    }

    static create(target: TSRestType, originalSource: string): TSRestTypeTypeClass {
        return new TSRestTypeTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSRestTypeTypeAnnotationPairs(),
                    'TSRestType.typeAnnotation',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TSRestTypeFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSRestTypeTypePair: EvaluatePair<TSRestType, TSRestTypeTypeClass> = makeEvaluatePair(
    isTSRestType,
    (target, originalSource) => TSRestTypeTypeClass.create(target, originalSource),
);

export const isTSRestTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSRestTypeTypeClass => target instanceof TSRestTypeTypeClass;
