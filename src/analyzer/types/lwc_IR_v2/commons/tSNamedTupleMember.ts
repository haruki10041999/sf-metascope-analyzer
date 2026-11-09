import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNamedTupleMember, type TSNamedTupleMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { IdentifierTypeClass } from './identifier';

export type TSNamedTupleMemberFields = TypeField<'tSNamedTupleMember'> & {
    label: IdentifierTypeClass;
    optional: TSNamedTupleMember['optional'];
    elementType: TSTypeTypeClass;
};

export class TSNamedTupleMemberTypeClass extends LwcCommonTypeClass<
    'tSNamedTupleMember',
    TSNamedTupleMemberFields
> {
    private constructor(value: FieldsOf<TSNamedTupleMemberFields>, sourceSpan: SourceSpan) {
        super('tSNamedTupleMember', value, sourceSpan);
    }

    static create(target: TSNamedTupleMember, originalSource: string): TSNamedTupleMemberTypeClass {
        return new TSNamedTupleMemberTypeClass(
            {
                label: IdentifierTypeClass.create(target.label, originalSource),
                optional: target.optional,
                elementType: visitNode(
                    target.elementType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLabel(): TSNamedTupleMemberFields['label'] {
        return this.getFields().label;
    }

    getOptional(): TSNamedTupleMemberFields['optional'] {
        return this.getFields().optional;
    }

    getElementType(): TSNamedTupleMemberFields['elementType'] {
        return this.getFields().elementType;
    }
}

export const tSNamedTupleMemberTypePair: EvaluatePair<
    TSNamedTupleMember,
    TSNamedTupleMemberTypeClass
> = makeEvaluatePair(isTSNamedTupleMember, (target, originalSource) =>
    TSNamedTupleMemberTypeClass.create(target, originalSource),
);

export const isTSNamedTupleMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNamedTupleMemberTypeClass => target instanceof TSNamedTupleMemberTypeClass;
