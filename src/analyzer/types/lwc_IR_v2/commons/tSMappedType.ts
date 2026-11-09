import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSMappedType, type TSMappedType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { IdentifierTypeClass } from './identifier';

/** マップ型の修飾子 (readonly・?) の付け方。true (修飾子だけ) は '+' と同じなので '+' にそろえる */
export type TSMappedTypeModifier = '+' | '-' | null;

const toMappedTypeModifier = (
    modifier: TSMappedType['readonly'] | TSMappedType['optional'],
): TSMappedTypeModifier => {
    if (modifier === true || modifier === '+') {
        return '+';
    }
    return modifier === '-' ? '-' : null;
};

export type TSMappedTypeFields = TypeField<'tSMappedType'> & {
    key: IdentifierTypeClass;
    constraint: TSTypeTypeClass;
    /** `readonly`・`+readonly` は '+'、`-readonly` は '-'、なしは null */
    readonly: TSMappedTypeModifier;
    /** `?`・`+?` は '+'、`-?` は '-'、なしは null */
    optional: TSMappedTypeModifier;
    typeAnnotation: TSTypeTypeClass | null;
    nameType: TSTypeTypeClass | null;
};

export class TSMappedTypeTypeClass extends LwcCommonTypeClass<'tSMappedType', TSMappedTypeFields> {
    private constructor(value: FieldsOf<TSMappedTypeFields>, sourceSpan: SourceSpan) {
        super('tSMappedType', value, sourceSpan);
    }

    static create(target: TSMappedType, originalSource: string): TSMappedTypeTypeClass {
        return new TSMappedTypeTypeClass(
            {
                key: IdentifierTypeClass.create(target.key, originalSource),
                constraint: visitNode(
                    target.constraint,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                readonly: toMappedTypeModifier(target.readonly),
                optional: toMappedTypeModifier(target.optional),
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                nameType: visitOptionalNode(
                    target.nameType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKey(): TSMappedTypeFields['key'] {
        return this.getFields().key;
    }

    getConstraint(): TSMappedTypeFields['constraint'] {
        return this.getFields().constraint;
    }

    getReadonly(): TSMappedTypeFields['readonly'] {
        return this.getFields().readonly;
    }

    getOptional(): TSMappedTypeFields['optional'] {
        return this.getFields().optional;
    }

    getTypeAnnotation(): TSMappedTypeFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getNameType(): TSMappedTypeFields['nameType'] {
        return this.getFields().nameType;
    }
}

export const tSMappedTypeTypePair: EvaluatePair<TSMappedType, TSMappedTypeTypeClass> =
    makeEvaluatePair(isTSMappedType, (target, originalSource) =>
        TSMappedTypeTypeClass.create(target, originalSource),
    );

export const isTSMappedTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSMappedTypeTypeClass => target instanceof TSMappedTypeTypeClass;
