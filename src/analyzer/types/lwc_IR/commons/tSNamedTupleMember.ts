import { isTSNamedTupleMember, type TSNamedTupleMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSNamedTupleMemberLabelPairs = lazyPairs(() => [identifierTypePair] as const);

export type TSNamedTupleMemberFields = {
    label: IdentifierTypeClass | LwcErrorTypeClass;
    optional: TSNamedTupleMember['optional'];
    elementType: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSNamedTupleMemberTypeClass extends LwcCommonTypeClass<'tSNamedTupleMember'> {
    private readonly value: TSNamedTupleMemberFields;

    private constructor(value: TSNamedTupleMemberFields) {
        super('tSNamedTupleMember');
        this.value = value;
    }

    static create(target: TSNamedTupleMember, originalSource: string): TSNamedTupleMemberTypeClass {
        return new TSNamedTupleMemberTypeClass({
            label: visitNode(
                target.label,
                originalSource,
                tSNamedTupleMemberLabelPairs(),
                'TSNamedTupleMember.label',
            ),
            optional: target.optional,
            elementType: visitNode(
                target.elementType,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSNamedTupleMemberFields {
        return this.value;
    }

    getLabel(): TSNamedTupleMemberFields['label'] {
        return this.value.label;
    }

    getOptional(): TSNamedTupleMemberFields['optional'] {
        return this.value.optional;
    }

    getElementType(): TSNamedTupleMemberFields['elementType'] {
        return this.value.elementType;
    }
}

export const tSNamedTupleMemberTypePair: EvaluatePair<
    TSNamedTupleMember,
    TSNamedTupleMemberTypeClass
> = makeEvaluatePair(isTSNamedTupleMember, (target, originalSource) =>
    TSNamedTupleMemberTypeClass.create(target, originalSource),
);

export const isTSNamedTupleMemberType = (
    target: LwcCommonTypeClass<string>,
): target is TSNamedTupleMemberTypeClass => target instanceof TSNamedTupleMemberTypeClass;
