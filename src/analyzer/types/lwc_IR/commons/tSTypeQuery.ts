import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeQuery, type TSTypeQuery } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { tSImportTypeTypePair, type TSImportTypeTypeClass } from './tSImportType';

const tSTypeQueryExprNamePairs = lazyPairs(
    () => [...tSEntityNameVisitorEvaluatePairs(), tSImportTypeTypePair] as const,
);

export type TSTypeQueryFields = TypeField<'tSTypeQuery'> & {
    exprName: TSEntityNameTypeClass | TSImportTypeTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
};

export class TSTypeQueryTypeClass extends LwcCommonTypeClass<'tSTypeQuery', TSTypeQueryFields> {
    private constructor(value: FieldsOf<TSTypeQueryFields>, sourceSpan: SourceSpan) {
        super('tSTypeQuery', value, sourceSpan);
    }

    static create(target: TSTypeQuery, originalSource: string): TSTypeQueryTypeClass {
        return new TSTypeQueryTypeClass(
            {
                exprName: visitNode(
                    target.exprName,
                    originalSource,
                    tSTypeQueryExprNamePairs(),
                    'TSTypeQuery.exprName',
                ),
                typeArguments:
                    target.typeArguments == null
                        ? null
                        : TSTypeParameterInstantiationTypeClass.create(
                              target.typeArguments,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExprName(): TSTypeQueryFields['exprName'] {
        return this.getFields().exprName;
    }

    getTypeArguments(): TSTypeQueryFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const tSTypeQueryTypePair: EvaluatePair<TSTypeQuery, TSTypeQueryTypeClass> =
    makeEvaluatePair(isTSTypeQuery, (target, originalSource) =>
        TSTypeQueryTypeClass.create(target, originalSource),
    );

export const isTSTypeQueryType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeQueryTypeClass => target instanceof TSTypeQueryTypeClass;
