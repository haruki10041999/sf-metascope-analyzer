import { isTSTypeParameter, type TSTypeParameter } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

const tSTypeParameterNamePairs = lazyPairs(() => [identifierTypePair] as const);

export type TSTypeParameterFields = {
    name: IdentifierTypeClass | LwcErrorTypeClass;
    in: NonNullable<TSTypeParameter['in']> | null;
    out: NonNullable<TSTypeParameter['out']> | null;
    const: NonNullable<TSTypeParameter['const']> | null;
    constraint: TSTypeTypeClass | LwcErrorTypeClass | null;
    default: TSTypeTypeClass | LwcErrorTypeClass | null;
};

export class TSTypeParameterTypeClass extends LwcCommonTypeClass<'tSTypeParameter'> {
    private readonly value: TSTypeParameterFields;

    private constructor(value: TSTypeParameterFields) {
        super('tSTypeParameter');
        this.value = value;
    }

    static create(target: TSTypeParameter, originalSource: string): TSTypeParameterTypeClass {
        return new TSTypeParameterTypeClass({
            name: visitNode(
                target.name,
                originalSource,
                tSTypeParameterNamePairs(),
                'TSTypeParameter.name',
            ),
            in: target.in ?? null,
            out: target.out ?? null,
            const: target.const ?? null,
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeParameterFields {
        return this.value;
    }

    getName(): TSTypeParameterFields['name'] {
        return this.value.name;
    }

    getIn(): TSTypeParameterFields['in'] {
        return this.value.in;
    }

    getOut(): TSTypeParameterFields['out'] {
        return this.value.out;
    }

    getConst(): TSTypeParameterFields['const'] {
        return this.value.const;
    }

    getConstraint(): TSTypeParameterFields['constraint'] {
        return this.value.constraint;
    }

    getDefault(): TSTypeParameterFields['default'] {
        return this.value.default;
    }
}

export const tSTypeParameterTypePair: EvaluatePair<TSTypeParameter, TSTypeParameterTypeClass> =
    makeEvaluatePair(isTSTypeParameter, (target, originalSource) =>
        TSTypeParameterTypeClass.create(target, originalSource),
    );

export const isTSTypeParameterType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterTypeClass => target instanceof TSTypeParameterTypeClass;
