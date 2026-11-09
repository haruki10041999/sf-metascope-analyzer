import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypePredicate, type TSTypePredicate } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { tSThisTypeTypePair, type TSThisTypeTypeClass } from './tSThisType';

const tSTypePredicateParameterNamePairs = lazyPairs(
    () => [identifierTypePair, tSThisTypeTypePair] as const,
);

/** `x is T` は型が要る。`asserts x` は型を省略できる (`asserts x is T` も書ける) */
export type TSTypePredicateFields = TypeField<'tSTypePredicate'> & {
    parameterName: IdentifierTypeClass | TSThisTypeTypeClass;
} & (
        | { asserts: false; typeAnnotation: TSTypeAnnotationTypeClass }
        | { asserts: true; typeAnnotation: TSTypeAnnotationTypeClass | null }
    );

export class TSTypePredicateTypeClass extends LwcCommonTypeClass<
    'tSTypePredicate',
    TSTypePredicateFields
> {
    private constructor(value: FieldsOf<TSTypePredicateFields>, sourceSpan: SourceSpan) {
        super('tSTypePredicate', value, sourceSpan);
    }

    static create(target: TSTypePredicate, originalSource: string): TSTypePredicateTypeClass {
        const parameterName = visitNode(
            target.parameterName,
            originalSource,
            tSTypePredicateParameterNamePairs(),
            'TSTypePredicate.parameterName',
        );
        const typeAnnotation =
            target.typeAnnotation == null
                ? null
                : TSTypeAnnotationTypeClass.create(target.typeAnnotation, originalSource);
        return new TSTypePredicateTypeClass(
            target.asserts
                ? { parameterName, asserts: true, typeAnnotation }
                : {
                      parameterName,
                      asserts: false,
                      typeAnnotation:
                          typeAnnotation ??
                          failIrBuild(
                              'TYPE_MISMATCH',
                              target,
                              originalSource,
                              'asserts でない型の述語 (x is T) には型が要ります',
                          ),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getParameterName(): TSTypePredicateFields['parameterName'] {
        return this.getFields().parameterName;
    }

    getTypeAnnotation(): TSTypePredicateFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getAsserts(): TSTypePredicateFields['asserts'] {
        return this.getFields().asserts;
    }
}

export const tSTypePredicateTypePair: EvaluatePair<TSTypePredicate, TSTypePredicateTypeClass> =
    makeEvaluatePair(isTSTypePredicate, (target, originalSource) =>
        TSTypePredicateTypeClass.create(target, originalSource),
    );

export const isTSTypePredicateType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypePredicateTypeClass => target instanceof TSTypePredicateTypeClass;
