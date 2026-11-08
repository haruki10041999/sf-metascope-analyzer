import { isTSTypePredicate, type TSTypePredicate } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { tSThisTypeTypePair, type TSThisTypeTypeClass } from './tSThisType';

const tSTypePredicateParameterNamePairs = lazyPairs(
    () => [identifierTypePair, tSThisTypeTypePair] as const,
);
const tSTypePredicateTypeAnnotationPairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);

export type TSTypePredicateFields = {
    parameterName: IdentifierTypeClass | TSThisTypeTypeClass | LwcErrorTypeClass;
    typeAnnotation: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    asserts: NonNullable<TSTypePredicate['asserts']> | null;
};

export class TSTypePredicateTypeClass extends LwcCommonTypeClass<'tSTypePredicate'> {
    private readonly value: TSTypePredicateFields;

    private constructor(value: TSTypePredicateFields) {
        super('tSTypePredicate');
        this.value = value;
    }

    static create(target: TSTypePredicate, originalSource: string): TSTypePredicateTypeClass {
        return new TSTypePredicateTypeClass({
            parameterName: visitNode(
                target.parameterName,
                originalSource,
                tSTypePredicateParameterNamePairs(),
                'TSTypePredicate.parameterName',
            ),
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                tSTypePredicateTypeAnnotationPairs(),
                'TSTypePredicate.typeAnnotation',
            ),
            asserts: target.asserts ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypePredicateFields {
        return this.value;
    }

    getParameterName(): TSTypePredicateFields['parameterName'] {
        return this.value.parameterName;
    }

    getTypeAnnotation(): TSTypePredicateFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getAsserts(): TSTypePredicateFields['asserts'] {
        return this.value.asserts;
    }
}

export const tSTypePredicateTypePair: EvaluatePair<TSTypePredicate, TSTypePredicateTypeClass> =
    makeEvaluatePair(isTSTypePredicate, (target, originalSource) =>
        TSTypePredicateTypeClass.create(target, originalSource),
    );

export const isTSTypePredicateType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypePredicateTypeClass => target instanceof TSTypePredicateTypeClass;
