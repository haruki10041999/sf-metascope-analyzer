import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSImportType, type TSImportType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { ObjectExpressionTypeClass } from './objectExpression';
import { StringLiteralTypeClass } from './stringLiteral';

export type TSImportTypeFields = TypeField<'tSImportType'> & {
    source: StringLiteralTypeClass;
    qualifier: TSEntityNameTypeClass | null;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
    options: ObjectExpressionTypeClass | null;
};

export class TSImportTypeTypeClass extends LwcCommonTypeClass<'tSImportType', TSImportTypeFields> {
    private constructor(value: FieldsOf<TSImportTypeFields>, sourceSpan: SourceSpan) {
        super('tSImportType', value, sourceSpan);
    }

    static create(target: TSImportType, originalSource: string): TSImportTypeTypeClass {
        return new TSImportTypeTypeClass(
            {
                source: StringLiteralTypeClass.create(target.source, originalSource),
                qualifier: visitOptionalNode(
                    target.qualifier,
                    originalSource,
                    tSEntityNameVisitorEvaluatePairs(),
                    'TSEntityNameVisitor',
                ),
                typeArguments:
                    target.typeArguments == null
                        ? null
                        : TSTypeParameterInstantiationTypeClass.create(
                              target.typeArguments,
                              originalSource,
                          ),
                options:
                    target.options == null
                        ? null
                        : ObjectExpressionTypeClass.create(target.options, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getSource(): TSImportTypeFields['source'] {
        return this.getFields().source;
    }

    getQualifier(): TSImportTypeFields['qualifier'] {
        return this.getFields().qualifier;
    }

    getTypeArguments(): TSImportTypeFields['typeArguments'] {
        return this.getFields().typeArguments;
    }

    getOptions(): TSImportTypeFields['options'] {
        return this.getFields().options;
    }
}

export const tSImportTypeTypePair: EvaluatePair<TSImportType, TSImportTypeTypeClass> =
    makeEvaluatePair(isTSImportType, (target, originalSource) =>
        TSImportTypeTypeClass.create(target, originalSource),
    );

export const isTSImportTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSImportTypeTypeClass => target instanceof TSImportTypeTypeClass;
