import { isTSTypeQuery, type TSTypeQuery } from '@babel/types';
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
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { tSImportTypeTypePair, type TSImportTypeTypeClass } from './tSImportType';

const tSTypeQueryExprNamePairs = lazyPairs(
    () => [...tSEntityNameVisitorEvaluatePairs(), tSImportTypeTypePair] as const,
);
const tSTypeQueryTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);

export type TSTypeQueryFields = {
    exprName: TSEntityNameTypeClass | TSImportTypeTypeClass | LwcErrorTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class TSTypeQueryTypeClass extends LwcCommonTypeClass<'tSTypeQuery'> {
    private readonly value: TSTypeQueryFields;

    private constructor(value: TSTypeQueryFields) {
        super('tSTypeQuery');
        this.value = value;
    }

    static create(target: TSTypeQuery, originalSource: string): TSTypeQueryTypeClass {
        return new TSTypeQueryTypeClass({
            exprName: visitNode(
                target.exprName,
                originalSource,
                tSTypeQueryExprNamePairs(),
                'TSTypeQuery.exprName',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSTypeQueryTypeArgumentsPairs(),
                'TSTypeQuery.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeQueryFields {
        return this.value;
    }

    getExprName(): TSTypeQueryFields['exprName'] {
        return this.value.exprName;
    }

    getTypeArguments(): TSTypeQueryFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const tSTypeQueryTypePair: EvaluatePair<TSTypeQuery, TSTypeQueryTypeClass> =
    makeEvaluatePair(isTSTypeQuery, (target, originalSource) =>
        TSTypeQueryTypeClass.create(target, originalSource),
    );

export const isTSTypeQueryType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeQueryTypeClass => target instanceof TSTypeQueryTypeClass;
