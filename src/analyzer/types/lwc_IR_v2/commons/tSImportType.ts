import { isTSImportType, type TSImportType } from '@babel/types';
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
import { objectExpressionTypePair, type ObjectExpressionTypeClass } from './objectExpression';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const tSImportTypeSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);
const tSImportTypeTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);
const tSImportTypeOptionsPairs = lazyPairs(() => [objectExpressionTypePair] as const);

export type TSImportTypeFields = {
    source: StringLiteralTypeClass | LwcErrorTypeClass;
    qualifier: TSEntityNameTypeClass | LwcErrorTypeClass | null;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
    options: ObjectExpressionTypeClass | LwcErrorTypeClass | null;
};

export class TSImportTypeTypeClass extends LwcCommonTypeClass<'tSImportType'> {
    private readonly value: TSImportTypeFields;

    private constructor(value: TSImportTypeFields) {
        super('tSImportType');
        this.value = value;
    }

    static create(target: TSImportType, originalSource: string): TSImportTypeTypeClass {
        return new TSImportTypeTypeClass({
            source: visitNode(
                target.source,
                originalSource,
                tSImportTypeSourcePairs(),
                'TSImportType.source',
            ),
            qualifier: visitOptionalNode(
                target.qualifier,
                originalSource,
                tSEntityNameVisitorEvaluatePairs(),
                'TSEntityNameVisitor',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSImportTypeTypeArgumentsPairs(),
                'TSImportType.typeArguments',
            ),
            options: visitOptionalNode(
                target.options,
                originalSource,
                tSImportTypeOptionsPairs(),
                'TSImportType.options',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSImportTypeFields {
        return this.value;
    }

    getSource(): TSImportTypeFields['source'] {
        return this.value.source;
    }

    getQualifier(): TSImportTypeFields['qualifier'] {
        return this.value.qualifier;
    }

    getTypeArguments(): TSImportTypeFields['typeArguments'] {
        return this.value.typeArguments;
    }

    getOptions(): TSImportTypeFields['options'] {
        return this.value.options;
    }
}

export const tSImportTypeTypePair: EvaluatePair<TSImportType, TSImportTypeTypeClass> =
    makeEvaluatePair(isTSImportType, (target, originalSource) =>
        TSImportTypeTypeClass.create(target, originalSource),
    );

export const isTSImportTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSImportTypeTypeClass => target instanceof TSImportTypeTypeClass;
