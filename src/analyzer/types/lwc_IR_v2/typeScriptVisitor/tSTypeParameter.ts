import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeParameter, type TSTypeParameter } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from '../commons/identifier';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

/** 型引数の変性の注釈 (`in T`・`out T`・`in out T`) */
export type TSTypeParameterVariance = 'none' | 'in' | 'out' | 'inout';

export type TSTypeParameterFields = TypeField<'tSTypeParameter'> & {
    name: IdentifierTypeClass;
    variance: TSTypeParameterVariance;
    const: boolean;
    constraint: TSTypeTypeClass | null;
    default: TSTypeTypeClass | null;
};

const toVariance = (isIn: boolean, isOut: boolean): TSTypeParameterVariance => {
    if (isIn) {
        return isOut ? 'inout' : 'in';
    }
    return isOut ? 'out' : 'none';
};

export class TSTypeParameterTypeClass extends LwcCommonTypeClass<
    'tSTypeParameter',
    TSTypeParameterFields
> {
    private constructor(value: FieldsOf<TSTypeParameterFields>, sourceSpan: SourceSpan) {
        super('tSTypeParameter', value, sourceSpan);
    }

    static create(target: TSTypeParameter, originalSource: string): TSTypeParameterTypeClass {
        return new TSTypeParameterTypeClass(
            {
                name: IdentifierTypeClass.create(target.name, originalSource),
                variance: toVariance(target.in ?? false, target.out ?? false),
                const: target.const ?? false,
                constraint: visitOptionalNode(
                    target.constraint,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                default: visitOptionalNode(
                    target.default,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): TSTypeParameterFields['name'] {
        return this.getFields().name;
    }

    getVariance(): TSTypeParameterFields['variance'] {
        return this.getFields().variance;
    }

    getConst(): TSTypeParameterFields['const'] {
        return this.getFields().const;
    }

    getConstraint(): TSTypeParameterFields['constraint'] {
        return this.getFields().constraint;
    }

    getDefault(): TSTypeParameterFields['default'] {
        return this.getFields().default;
    }
}

export const tSTypeParameterTypePair: EvaluatePair<TSTypeParameter, TSTypeParameterTypeClass> =
    makeEvaluatePair(isTSTypeParameter, (target, originalSource) =>
        TSTypeParameterTypeClass.create(target, originalSource),
    );

export const isTSTypeParameterType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeParameterTypeClass => target instanceof TSTypeParameterTypeClass;
