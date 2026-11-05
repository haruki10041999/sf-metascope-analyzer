// apex_IR のノードの CommonType (IR → CommonType の変換は generic.ts の 1 つの変換)。
// LWC の types/lwc/converter/nodes.ts と同じく、すべての XxxType をこのファイルにまとめる。
// 種類は type (CommonType の判別子) で分かるので、型判定関数 (isXxxType) は持たない
import type { CommonType, ValueRuleValue } from '../../commons/converter';

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------

export type ArgumentsType = CommonType<'arguments'> & {
    value: ValueRuleValue<ExpressionListType | null>;
};

export type TypeArgumentsType = CommonType<'typeArguments'> & {
    value: ValueRuleValue<TypeListType | null>;
};

// ---------------------------------------------------------------------------
// block
// ---------------------------------------------------------------------------

export type AnonymousBlockType = CommonType<'anonymousBlock'> & {
    value: ValueRuleValue<AnonymousBlockMemberType>[];
};

export type FinallyBlockType = CommonType<'finallyBlock'> & {
    block: ValueRuleValue<BlockType>;
};

export type GetterType = CommonType<'getter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export type BlockType = CommonType<'block'> & {
    value: ValueRuleValue<StatementType>[];
};

export type PropertyBlockType = CommonType<'propertyBlock'> & {
    value: ValueRuleValue<SetterType | GetterType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export type SetterType = CommonType<'setter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export type TriggerBlockType = CommonType<'triggerBlock'> & {
    value: ValueRuleValue<TriggerBlockMemberType>[];
};

// ---------------------------------------------------------------------------
// body
// ---------------------------------------------------------------------------

export type ClassBodyType = CommonType<'classBody'> & {
    value: ValueRuleValue<ClassBodyDeclarationType>[];
};

export type InterfaceBodyType = CommonType<'interfaceBody'> & {
    value: ValueRuleValue<InterfaceMethodDeclarationType>[];
};

// ---------------------------------------------------------------------------
// call
// ---------------------------------------------------------------------------

export type DotMethodCallType = CommonType<'dotMethodCall'> & {
    value: ValueRuleValue<AnyIdType>;
    param: ValueRuleValue<ExpressionListType | null>;
};

export type MethodCallType = CommonType<'methodCall'> &
    (
        | {
              value: ValueRuleValue<IdType>;
              param: ValueRuleValue<ExpressionListType | null>;
              reference: 'this' | 'super' | null;
          }
        | {
              value: 'this' | 'super';
              param: ValueRuleValue<ExpressionListType | null>;
          }
    );

// ---------------------------------------------------------------------------
// clause
// ---------------------------------------------------------------------------

export type AllRowsClauseType = CommonType<'allRowsClause'> & {
    value: string;
};

export type CatchClauseType = CommonType<'catchClause'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<QualifiedNameType>;
    block: ValueRuleValue<BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export type DataCategorySelectionType = CommonType<'dataCategorySelection'> & {
    value: ValueRuleValue<SoqlIdType>;
    selector: ValueRuleValue<FilteringSelectorType>;
    category: ValueRuleValue<DataCategoryNameType>;
};

export type ElseClauseType = CommonType<'elseClause'> & {
    value: ValueRuleValue<FieldNameListType>;
};

export type FieldGroupByType = CommonType<'fieldGroupBy'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
};

export type FieldOrderType = CommonType<'fieldOrder'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    direction: 'ASC' | 'DESC' | null;
    nulls: 'FIRST' | 'LAST' | null;
};

export type FilteringSelectorType = CommonType<'filteringSelector'> & {
    value: 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';
};

export type ForClausesType = CommonType<'forClauses'> & {
    value: ('VIEW' | 'UPDATE' | 'REFERENCE')[];
};

export type GroupByClauseType = CommonType<'groupByClause'> & {
    value: ValueRuleValue<FieldGroupByListType>;
    mode: 'ROLLUP' | 'CUBE' | null;
    having: ValueRuleValue<LogicalExpressionType | null>;
};

export type LimitClauseType = CommonType<'limitClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export type OffsetClauseType = CommonType<'offsetClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export type OrderByClauseType = CommonType<'orderByClause'> & {
    value: ValueRuleValue<FieldOrderListType>;
};

export type SoslClausesType = CommonType<'soslClauses'> & {
    value: ValueRuleValue<SearchGroupType | null>;
    fieldSpecList: ValueRuleValue<FieldSpecListType | null>;
    withList: ValueRuleValue<SoslWithClauseType>[] | null;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export type SoslWithClauseType = CommonType<'soslWithClause'> &
    (
        | {
              value: 'DIVISION' | 'PRICEBOOKID';
              content: ValueRuleValue<string | BoundExpressionType>;
          }
        | {
              value: 'DATA_CATEGORY';
              content: ValueRuleValue<FilteringExpressionType>;
          }
        | {
              value: 'SNIPPET' | 'SPELL_CORRECTION';
              content: string | null;
          }
        | {
              value: 'NETWORK';
              content: ValueRuleValue<string | NetworkListType>;
          }
        | {
              value: 'METADATA';
              content: string;
          }
        | {
              value: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE';
          }
    );

export type TypeOfType = CommonType<'typeOf'> & {
    value: ValueRuleValue<FieldNameType>;
    whenClause: ValueRuleValue<WhenClauseType>[];
    elseClause: ValueRuleValue<ElseClauseType | null>;
};

export type UpdateTypeType = CommonType<'updateType'> & {
    value: 'TRACKING' | 'VIEWSTAT';
};

export type UsingScopeType = CommonType<'usingScope'> & {
    value: ValueRuleValue<SoqlIdType>;
};

export type WhenClauseType = CommonType<'whenClause'> & {
    value: ValueRuleValue<FieldNameType>;
    field: ValueRuleValue<FieldNameListType>;
};

export type WhereClauseType = CommonType<'whereClause'> & {
    value: ValueRuleValue<WhereLogicalExpressionType>;
};

export type WithClauseType = CommonType<'withClause'> &
    (
        | {
              value: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
          }
        | {
              value: ValueRuleValue<LogicalExpressionType>;
          }
        | {
              value: 'DATA_CATEGORY';
              field: ValueRuleValue<FilteringExpressionType>;
          }
    );

// ---------------------------------------------------------------------------
// control
// ---------------------------------------------------------------------------

export type EnhancedForControlType = CommonType<'enhancedForControl'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    fromVariant: ValueRuleValue<BaseExpressionType>;
};

export type ForControlType = CommonType<'forControl'> & {
    value: ValueRuleValue<EnhancedForControlType | BaseExpressionType | null>;
    init: ValueRuleValue<ForInitType | null>;
    update: ValueRuleValue<ForUpdateType | null>;
};

export type ForInitType = CommonType<'forInit'> & {
    value: ValueRuleValue<LocalVariableDeclarationType | ExpressionListType>;
};

export type ForUpdateType = CommonType<'forUpdate'> & {
    value: ValueRuleValue<ExpressionListType>;
};

export type WhenControlType = CommonType<'whenControl'> & {
    value: ValueRuleValue<WhenValueType>;
    block: ValueRuleValue<BlockType>;
};

// ---------------------------------------------------------------------------
// declaration
// ---------------------------------------------------------------------------

export type AnonymousMemberDeclarationType = CommonType<'anonymousMemberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export type ClassBodyDeclarationType = CommonType<'classBodyDeclaration'> & {
    value: ValueRuleValue<MemberDeclarationType | BlockType | null>;
    modifier: ValueRuleValue<ModifierType>[];
    isStatic: boolean;
};

export type ClassDeclarationType = CommonType<'classDeclaration'> & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<ClassBodyType>;
    extend: ValueRuleValue<TypeRefType | null>;
    implement: ValueRuleValue<TypeListType | null>;
};

export type ConstructorDeclarationType = CommonType<'constructorDeclaration'> & {
    value: ValueRuleValue<QualifiedNameType>;
    param: ValueRuleValue<FormalParametersType | null>;
    block: ValueRuleValue<BlockType>;
};

export type EnumConstantsType = CommonType<'enumConstants'> & {
    value: ValueRuleValue<IdType>[];
};

export type EnumDeclarationType = CommonType<'enumDeclaration'> & {
    value: ValueRuleValue<IdType>;
    constant: ValueRuleValue<EnumConstantsType | null>;
};

export type FieldDeclarationType = CommonType<'fieldDeclaration'> & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export type InterfaceDeclarationType = CommonType<'interfaceDeclaration'> & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<InterfaceBodyType>;
    extend: ValueRuleValue<TypeListType | null>;
};

export type InterfaceMethodDeclarationType = CommonType<'interfaceMethodDeclaration'> & {
    value: ValueRuleValue<IdType>;
} & ({ valueType: 'void' } | { valueType: ValueRuleValue<TypeRefType> }) & {
        param: ValueRuleValue<FormalParametersType | null>;
        modifier: ValueRuleValue<ModifierType>[];
    };

export type LocalVariableDeclarationType = CommonType<'localVariableDeclaration'> & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export type MemberDeclarationType = CommonType<'memberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | ConstructorDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export type MethodDeclarationType = CommonType<'methodDeclaration'> & {
    value: ValueRuleValue<IdType>;
} & ({ valueType: 'void' } | { valueType: ValueRuleValue<TypeRefType> }) & {
        param: ValueRuleValue<FormalParametersType | null>;
        block: ValueRuleValue<BlockType | null>;
    };

export type PropertyDeclarationType = CommonType<'propertyDeclaration'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    block: ValueRuleValue<PropertyBlockType>[];
};

export type TriggerMemberDeclarationType = CommonType<'triggerMemberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export type TypeDeclarationType = CommonType<'typeDeclaration'> & {
    value: ValueRuleValue<InterfaceDeclarationType | ClassDeclarationType | EnumDeclarationType>;
    modifier: ValueRuleValue<ModifierType>[];
};

// ---------------------------------------------------------------------------
// entry
// ---------------------------------------------------------------------------

export type SelectEntryType = CommonType<'selectEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export type SubFieldEntryType = CommonType<'subFieldEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

// ---------------------------------------------------------------------------
// expression
// ---------------------------------------------------------------------------

export type ArrayExpressionType = CommonType<'arrayExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    index: ValueRuleValue<BaseExpressionType>;
};

export type Arth1ExpressionType = CommonType<'arth1Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '*' | '/';
    right: ValueRuleValue<BaseExpressionType>;
};

export type Arth2ExpressionType = CommonType<'arth2Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '+' | '-';
    right: ValueRuleValue<BaseExpressionType>;
};

export type AssignExpressionType = CommonType<'assignExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';
    right: ValueRuleValue<BaseExpressionType>;
};

export type BitAndExpressionType = CommonType<'bitAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&';
    right: ValueRuleValue<BaseExpressionType>;
};

export type BitExpressionType = CommonType<'bitExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export type BitNotExpressionType = CommonType<'bitNotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '^';
    right: ValueRuleValue<BaseExpressionType>;
};

export type BitOrExpressionType = CommonType<'bitOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '|';
    right: ValueRuleValue<BaseExpressionType>;
};

export type BoundExpressionType = CommonType<'boundExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export type CastExpressionType = CommonType<'castExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export type CmpExpressionType = CommonType<'cmpExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export type CoalExpressionType = CommonType<'coalExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '??';
    right: ValueRuleValue<BaseExpressionType>;
};

export type CondExpressionType = CommonType<'condExpression'> & {
    condition: ValueRuleValue<BaseExpressionType>;
    trueValue: ValueRuleValue<BaseExpressionType>;
    falseValue: ValueRuleValue<BaseExpressionType>;
};

export type ConditionalExpressionType = CommonType<'conditionalExpression'> & {
    value: ValueRuleValue<FieldExpressionType | LogicalExpressionType>;
};

export type DotExpressionType = CommonType<'dotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '.' | '?.';
    right: ValueRuleValue<AnyIdType | DotMethodCallType>;
};

export type EqualityExpressionType = CommonType<'equalityExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '===' | '!==' | '==' | '!=' | '<>';
    right: ValueRuleValue<BaseExpressionType>;
};

export type FieldExpressionType = CommonType<'fieldExpression'> & {
    left: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export type FilteringExpressionType = CommonType<'filteringExpression'> & {
    value: ValueRuleValue<DataCategorySelectionType>[];
};

export type InstanceOfExpressionType = CommonType<'instanceOfExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: 'instanceof';
    right: ValueRuleValue<TypeRefType>;
};

export type LogAndExpressionType = CommonType<'logAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&&';
    right: ValueRuleValue<BaseExpressionType>;
};

export type LogicalExpressionType = CommonType<'logicalExpression'> & {
    value: ValueRuleValue<ConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export type LogOrExpressionType = CommonType<'logOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '||';
    right: ValueRuleValue<BaseExpressionType>;
};

export type MethodCallExpressionType = CommonType<'methodCallExpression'> & {
    value: ValueRuleValue<MethodCallType>;
};

export type NegExpressionType = CommonType<'negExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '~' | '!';
};

export type NewExpressionType = CommonType<'newExpression'> & {
    value: ValueRuleValue<CreatorType>;
};

export type ExpressionType = CommonType<'expression'> & {
    value: string;
};

export type ParExpressionType = CommonType<'parExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export type PostOpExpressionType = CommonType<'postOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--';
};

export type PreOpExpressionType = CommonType<'preOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--' | '+' | '-';
};

export type PrimaryExpressionType = CommonType<'primaryExpression'> & {
    value: ValueRuleValue<BasePrimaryType>;
};

export type SubExpressionType = CommonType<'subExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export type WhereConditionalExpressionType = CommonType<'whereConditionalExpression'> & {
    value: ValueRuleValue<WhereFieldExpressionType | WhereLogicalExpressionType>;
};

export type WhereFieldExpressionType = CommonType<'whereFieldExpression'> & {
    left: ValueRuleValue<string | FieldExpressionType>;
    operator: ValueRuleValue<ComparisonOperatorType | null>;
    right: ValueRuleValue<ValueType | null>;
};

export type WhereLogicalExpressionType = CommonType<'whereLogicalExpression'> & {
    value: ValueRuleValue<WhereConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export type BaseExpressionType =
    | ExpressionType
    | PrimaryExpressionType
    | DotExpressionType
    | MethodCallExpressionType
    | NewExpressionType
    | CastExpressionType
    | SubExpressionType
    | ArrayExpressionType
    | Arth1ExpressionType
    | Arth2ExpressionType
    | AssignExpressionType
    | BitAndExpressionType
    | BitExpressionType
    | BitOrExpressionType
    | BitNotExpressionType
    | CmpExpressionType
    | CoalExpressionType
    | CondExpressionType
    | EqualityExpressionType
    | InstanceOfExpressionType
    | LogAndExpressionType
    | LogOrExpressionType
    | NegExpressionType
    | PostOpExpressionType
    | PreOpExpressionType;

// ---------------------------------------------------------------------------
// id
// ---------------------------------------------------------------------------

export type AnyIdType = CommonType<'anyId'> & {
    value: string;
};

export type IdType = CommonType<'id'> & {
    value: string;
};

export type SoqlIdType = CommonType<'soqlId'> & {
    value: ValueRuleValue<IdType>;
};

export type SoslIdType = CommonType<'soslId'> & {
    value: ValueRuleValue<IdType>[];
};

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

export type ExpressionListType = CommonType<'expressionList'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export type FieldGroupByListType = CommonType<'fieldGroupByList'> & {
    value: ValueRuleValue<FieldGroupByType>[];
};

export type FieldListType = CommonType<'fieldList'> & {
    value: ValueRuleValue<SoslFieldType>[];
};

export type FieldNameListType = CommonType<'fieldNameList'> & {
    value: ValueRuleValue<FieldNameType>[];
};

export type FieldOrderListType = CommonType<'fieldOrderList'> & {
    value: ValueRuleValue<FieldOrderType>[];
};

export type FieldSpecListType = CommonType<'fieldSpecList'> & {
    value: ValueRuleValue<FieldSpecType>[];
};

export type FormalParameterListType = CommonType<'formalParameterList'> & {
    value: ValueRuleValue<FormalParameterType>[];
};

export type FromNameListType = CommonType<'fromNameList'> & {
    value: ValueRuleValue<FromNameType>[];
};

export type FromNameType = CommonType<'fromName'> & {
    value: ValueRuleValue<FieldNameType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export type NetworkListType = CommonType<'networkList'> & {
    value: ValueRuleValue<string>[];
};

export type SelectListType = CommonType<'selectList'> & {
    value: ValueRuleValue<SelectEntryType>[];
};

export type SoslFieldType = CommonType<'soslField'> & {
    value: ValueRuleValue<SoslIdType | SoqlFunctionType>;
    func: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' | null;
};

export type SubFieldListType = CommonType<'subFieldList'> & {
    value: ValueRuleValue<SubFieldEntryType>[];
};

export type TypeListType = CommonType<'typeList'> & {
    value: ValueRuleValue<TypeRefType>[];
};

export type UpdateListType = CommonType<'updateList'> & {
    value: ValueRuleValue<UpdateTypeType>[];
};

export type ValueListType = CommonType<'valueList'> & {
    value: ValueRuleValue<ValueType>[];
};

// ---------------------------------------------------------------------------
// literal
// ---------------------------------------------------------------------------

export type LiteralType = CommonType<'literal'> & {
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

export type SignedIntegerType = CommonType<'signedInteger'> & {
    value: string;
    valueType: 'integer';
    operator: '+' | '-' | null;
};

export type SignedNumberType = CommonType<'signedNumber'> & {
    value: string;
    valueType: 'number' | 'integer';
    operator: '+' | '-' | null;
};

export type SoqlLiteralType = CommonType<'soqlLiteral'> & {
    value: ValueRuleValue<QueryType>;
};

export type SoslLiteralAltType = CommonType<'soslLiteralAlt'> & {
    value: string;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export type SoslLiteralType = CommonType<'soslLiteral'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export type WhenLiteralType =
    | (CommonType<'whenLiteral'> & {
          value: string;
          valueType: 'string' | 'longText' | 'null';
      })
    | {
          value: string;
          valueType: 'integer' | 'long';
          operator: string | null;
      }
    | {
          value: ValueRuleValue<QualifiedNameType>;
          valueType: 'id';
      };

// ---------------------------------------------------------------------------
// member
// ---------------------------------------------------------------------------

export type AnonymousBlockMemberType = CommonType<'anonymousBlockMember'> & {
    value: ValueRuleValue<AnonymousMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export type TriggerBlockMemberType = CommonType<'triggerBlockMember'> & {
    value: ValueRuleValue<TriggerMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

// ---------------------------------------------------------------------------
// modifier
// ---------------------------------------------------------------------------

export type AnnotationType = CommonType<'annotation'> & {
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ElementValueType | ElementValuePairsType | null>;
};

export type ModifierType = CommonType<'modifier'> &
    (
        | {
              value:
                  | 'GLOBAL'
                  | 'PUBLIC'
                  | 'PROTECTED'
                  | 'PRIVATE'
                  | 'TRANSIENT'
                  | 'STATIC'
                  | 'ABSTRACT'
                  | 'FINAL'
                  | 'WEBSERVICE'
                  | 'OVERRIDE'
                  | 'VIRTUAL'
                  | 'TESTMETHOD'
                  | 'WITH_SHARING'
                  | 'WITHOUT_SHARING'
                  | 'INHERITED_SHARING';
          }
        | {
              value: ValueRuleValue<AnnotationType>;
          }
    );

// ---------------------------------------------------------------------------
// name
// ---------------------------------------------------------------------------

export type CreatedNameType = CommonType<'createdName'> & {
    value: ValueRuleValue<IdCreatedNamePairType>[];
};

export type DataCategoryNameType = CommonType<'dataCategoryName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export type DateFieldNameType = CommonType<'dateFieldName'> & {
    value: ValueRuleValue<FieldNameType>;
    isConvertTimeZone: boolean;
};

export type FieldNameType = CommonType<'fieldName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export type QualifiedNameType = CommonType<'qualifiedName'> & {
    value: ValueRuleValue<IdType>[];
};

export type TypeNameType = CommonType<'typeName'> &
    (
        | {
              value: 'list' | 'set' | 'map';
          }
        | {
              value: ValueRuleValue<IdType>;
          }
    ) & {
        generic: ValueRuleValue<TypeArgumentsType | null>;
    };

// ---------------------------------------------------------------------------
// pair
// ---------------------------------------------------------------------------

export type ElementValuePairsType = CommonType<'elementValuePairs'> & {
    value: ValueRuleValue<ElementValuePairType>[];
};

export type ElementValuePairType = CommonType<'elementValuePair'> & {
    left: ValueRuleValue<IdType>;
    right: ValueRuleValue<ElementValueType>;
};

export type IdCreatedNamePairType = CommonType<'idCreatedNamePair'> & {
    left: ValueRuleValue<AnyIdType>;
    right: ValueRuleValue<TypeListType | null>;
};

export type MapCreatorRestPairType = CommonType<'mapCreatorRestPair'> & {
    left: ValueRuleValue<BaseExpressionType>;
    right: ValueRuleValue<BaseExpressionType>;
};

// ---------------------------------------------------------------------------
// parameter
// ---------------------------------------------------------------------------

export type FormalParametersType = CommonType<'formalParameters'> & {
    value: ValueRuleValue<FormalParameterListType | null>;
};

export type FormalParameterType = CommonType<'formalParameter'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export type SoqlFieldsParameterType = CommonType<'soqlFieldsParameter'> & {
    value: 'ALL' | 'CUSTOM' | 'STANDARD';
};

// ---------------------------------------------------------------------------
// primary
// ---------------------------------------------------------------------------

export type IdPrimaryType = CommonType<'idPrimary'> & {
    value: ValueRuleValue<IdType>;
};

export type LiteralPrimaryType = CommonType<'literalPrimary'> & {
    value: ValueRuleValue<LiteralType>;
};

export type PrimaryType = CommonType<'primary'> & {
    value: string;
};

export type SoqlPrimaryType = CommonType<'soqlPrimary'> & {
    value: ValueRuleValue<SoqlLiteralType>;
};

export type SoslPrimaryType = CommonType<'soslPrimary'> & {
    value: ValueRuleValue<SoslLiteralType>;
};

export type SuperPrimaryType = CommonType<'superPrimary'> & {
    value: string;
};

export type ThisPrimaryType = CommonType<'thisPrimary'> & {
    value: string;
};

export type TypeRefPrimaryType = CommonType<'typeRefPrimary'> & {
    value: ValueRuleValue<TypeRefType>;
};

export type VoidPrimaryType = CommonType<'voidPrimary'> & {
    value: string;
};

export type BasePrimaryType =
    | IdPrimaryType
    | LiteralPrimaryType
    | SoqlPrimaryType
    | SoslPrimaryType
    | TypeRefPrimaryType
    | VoidPrimaryType
    | SuperPrimaryType
    | ThisPrimaryType
    | PrimaryType;

// ---------------------------------------------------------------------------
// query
// ---------------------------------------------------------------------------

export type ComparisonOperatorType = CommonType<'comparisonOperator'> & {
    value:
        | '='
        | '!='
        | '<'
        | '>'
        | '<='
        | '>='
        | '<>'
        | 'LIKE'
        | 'IN'
        | 'NOT IN'
        | 'INCLUDES'
        | 'EXCLUDES';
};

export type DateFormulaType = CommonType<'dateFormula'> &
    (
        | {
              value:
                  | 'YESTERDAY'
                  | 'TODAY'
                  | 'TOMORROW'
                  | 'LAST_WEEK'
                  | 'THIS_WEEK'
                  | 'NEXT_WEEK'
                  | 'LAST_MONTH'
                  | 'THIS_MONTH'
                  | 'NEXT_MONTH'
                  | 'LAST_90_DAYS'
                  | 'NEXT_90_DAYS'
                  | 'THIS_QUARTER'
                  | 'LAST_QUARTER'
                  | 'NEXT_QUARTER'
                  | 'THIS_YEAR'
                  | 'LAST_YEAR'
                  | 'NEXT_YEAR'
                  | 'THIS_FISCAL_QUARTER'
                  | 'LAST_FISCAL_QUARTER'
                  | 'NEXT_FISCAL_QUARTER'
                  | 'THIS_FISCAL_YEAR'
                  | 'LAST_FISCAL_YEAR'
                  | 'NEXT_FISCAL_YEAR';
          }
        | {
              value:
                  | 'LAST_N_DAYS_N'
                  | 'NEXT_N_DAYS_N'
                  | 'N_DAYS_AGO_N'
                  | 'NEXT_N_WEEKS_N'
                  | 'LAST_N_WEEKS_N'
                  | 'N_WEEKS_AGO_N'
                  | 'NEXT_N_MONTHS_N'
                  | 'LAST_N_MONTHS_N'
                  | 'N_MONTHS_AGO_N'
                  | 'NEXT_N_QUARTERS_N'
                  | 'LAST_N_QUARTERS_N'
                  | 'N_QUARTERS_AGO_N'
                  | 'NEXT_N_FISCAL_QUARTERS_N'
                  | 'LAST_N_FISCAL_QUARTERS_N'
                  | 'N_FISCAL_QUARTERS_AGO_N'
                  | 'NEXT_N_YEARS_N'
                  | 'LAST_N_YEARS_N'
                  | 'N_YEARS_AGO_N'
                  | 'NEXT_N_FISCAL_YEARS_N'
                  | 'LAST_N_FISCAL_YEARS_N'
                  | 'N_FISCAL_YEARS_AGO_N';
              param: ValueRuleValue<SignedIntegerType>;
          }
    );

export type FieldSpecType = CommonType<'fieldSpec'> & {
    value: ValueRuleValue<SoslIdType>;
    fieldList: ValueRuleValue<FieldListType | null>;
    where: ValueRuleValue<LogicalExpressionType | null>;
    listView: ValueRuleValue<SoslIdType | null>;
    orderBy: ValueRuleValue<FieldOrderListType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    offsetClause: ValueRuleValue<OffsetClauseType | null>;
};

export type QueryType = CommonType<'query'> & {
    value: ValueRuleValue<SelectListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType | null>;
    usingScope: ValueRuleValue<UsingScopeType | null>;
    whereClause: ValueRuleValue<WhereClauseType | null>;
    withClause: ValueRuleValue<WithClauseType | null>;
    groupByClause: ValueRuleValue<GroupByClauseType | null>;
    orderByClause: ValueRuleValue<OrderByClauseType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    offsetClause: ValueRuleValue<OffsetClauseType | null>;
    allRowsClause: ValueRuleValue<AllRowsClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export type SearchGroupType = CommonType<'searchGroup'> & {
    value: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
};

export type SoqlFunctionType = CommonType<'soqlFunction'> &
    (
        | {
              value:
                  | 'AVG'
                  | 'COUNT_DISTINCT'
                  | 'MIN'
                  | 'MAX'
                  | 'SUM'
                  | 'TOLABEL'
                  | 'GROUPING'
                  | 'CONVERT_CURRENCY';
              param: ValueRuleValue<FieldNameType>;
          }
        | {
              value:
                  | 'CALENDAR_MONTH'
                  | 'CALENDAR_QUARTER'
                  | 'CALENDAR_YEAR'
                  | 'DAY_IN_MONTH'
                  | 'DAY_IN_WEEK'
                  | 'DAY_IN_YEAR'
                  | 'DAY_ONLY'
                  | 'FISCAL_MONTH'
                  | 'FISCAL_QUARTER'
                  | 'FISCAL_YEAR'
                  | 'HOUR_IN_DAY'
                  | 'WEEK_IN_MONTH'
                  | 'WEEK_IN_YEAR';
              param: ValueRuleValue<DateFieldNameType>;
          }
        | {
              value: 'COUNT';
              param: ValueRuleValue<FieldNameType | null>;
          }
        | {
              value: 'FORMAT';
              param: ValueRuleValue<FieldNameType | SoqlFunctionType>;
          }
        | {
              value: 'FIELDS';
              param: ValueRuleValue<SoqlFieldsParameterType>;
          }
        | {
              value: 'DISTANCE';
              param: ValueRuleValue<LocationValueType | string>[];
          }
    );

export type SubQueryType = CommonType<'subQuery'> & {
    value: ValueRuleValue<SubFieldListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType | null>;
    whereClause: ValueRuleValue<WhereClauseType | null>;
    orderByClause: ValueRuleValue<OrderByClauseType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

// ---------------------------------------------------------------------------
// rest
// ---------------------------------------------------------------------------

export type ArrayCreatorRestType = CommonType<'arrayCreatorRest'> & {
    value: ValueRuleValue<ArrayInitializerType | null>;
    size: ValueRuleValue<BaseExpressionType | null>;
};

export type ClassCreatorRestType = CommonType<'classCreatorRest'> & {
    value: ValueRuleValue<ArgumentsType>;
};

export type MapCreatorRestType = CommonType<'mapCreatorRest'> & {
    value: ValueRuleValue<MapCreatorRestPairType>[];
};

export type NoRestType = CommonType<'noRest'> & {
    value: string;
};

export type SetCreatorRestType = CommonType<'setCreatorRest'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export type CreatorType = CommonType<'creator'> & {
    value: ValueRuleValue<CreatedNameType>;
    rest: ValueRuleValue<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >;
};

// ---------------------------------------------------------------------------
// statement
// ---------------------------------------------------------------------------

export type AccessLevelType = CommonType<'accessLevel'> & {
    value: 'SYSTEM' | 'USER';
};

export type BreakStatementType = CommonType<'breakStatement'> & {
    value: string;
};

export type ContinueStatementType = CommonType<'continueStatement'> & {
    value: string;
};

export type DeleteStatementType = CommonType<'deleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export type DoWhileStatementType = CommonType<'doWhileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<BlockType>;
};

export type ExpressionStatementType = CommonType<'expressionStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export type ForStatementType = CommonType<'forStatement'> & {
    value: ValueRuleValue<ForControlType>;
    block: ValueRuleValue<StatementType>;
};

export type IfStatementType = CommonType<'ifStatement'> & {
    value: ValueRuleValue<
        {
            condition: ValueRuleValue<ParExpressionType | 'else'>;
            block: ValueRuleValue<StatementType>;
        }[]
    >;
};

export type InsertStatementType = CommonType<'insertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export type LocalVariableDeclarationStatementType =
    CommonType<'localVariableDeclarationStatement'> & {
        value: ValueRuleValue<LocalVariableDeclarationType>;
    };

export type MergeStatementType = CommonType<'mergeStatement'> & {
    value: ValueRuleValue<BaseExpressionType>[];
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export type ReturnStatementType = CommonType<'returnStatement'> & {
    value: ValueRuleValue<BaseExpressionType | null>;
};

export type RunAsStatementType = CommonType<'runAsStatement'> & {
    value: ValueRuleValue<ExpressionListType>;
    block: ValueRuleValue<BlockType>;
};

export type SwitchStatementType = CommonType<'switchStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    block: ValueRuleValue<WhenControlType>[];
};

export type ThrowStatementType = CommonType<'throwStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export type TryStatementType = CommonType<'tryStatement'> & {
    block: ValueRuleValue<BlockType>;
    catchBlock: ValueRuleValue<CatchClauseType>[];
    finallyBlock: ValueRuleValue<FinallyBlockType | null>;
};

export type UndeleteStatementType = CommonType<'undeleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export type UpdateStatementType = CommonType<'updateStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export type UpsertStatementType = CommonType<'upsertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
    key: ValueRuleValue<QualifiedNameType | null>;
};

export type WhileStatementType = CommonType<'whileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<StatementType>;
};

export type StatementType = CommonType<'statement'> & {
    value: ValueRuleValue<
        | BlockType
        | IfStatementType
        | SwitchStatementType
        | ForStatementType
        | WhileStatementType
        | DoWhileStatementType
        | TryStatementType
        | ReturnStatementType
        | ThrowStatementType
        | BreakStatementType
        | ContinueStatementType
        | InsertStatementType
        | UpdateStatementType
        | DeleteStatementType
        | UndeleteStatementType
        | UpsertStatementType
        | MergeStatementType
        | RunAsStatementType
        | LocalVariableDeclarationStatementType
        | ExpressionStatementType
    >;
};

// ---------------------------------------------------------------------------
// type
// ---------------------------------------------------------------------------

export type ArraySubscriptsType = CommonType<'arraySubscripts'> & {
    value: number | null;
};

export type TypeRefType = CommonType<'typeRef'> & {
    value: ValueRuleValue<TypeNameType>[];
    dimension: ValueRuleValue<ArraySubscriptsType>;
};

// ---------------------------------------------------------------------------
// unit
// ---------------------------------------------------------------------------

export type AnonymousUnitType = CommonType<'anonymousUnit'> & {
    value: ValueRuleValue<AnonymousBlockType>;
};

export type CompilationUnitType = CommonType<'compilationUnit'> & {
    value: ValueRuleValue<TypeDeclarationType>;
};

export type TriggerCaseType = CommonType<'triggerCase'> & {
    timing: 'BEFORE' | 'AFTER';
    triggerCaseType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
};

export type TriggerUnitType = CommonType<'triggerUnit'> & {
    value: ValueRuleValue<IdType>[];
    triggerCase: ValueRuleValue<TriggerCaseType>[];
    block: ValueRuleValue<TriggerBlockType>;
};

// ---------------------------------------------------------------------------
// value
// ---------------------------------------------------------------------------

export type CoordinateValueType = CommonType<'coordinateValue'> & {
    value: ValueRuleValue<SignedNumberType | BoundExpressionType>;
};

export type ElementValueType = CommonType<'elementValue'> & {
    value: ValueRuleValue<LiteralType>;
};

export type LocationValueType = CommonType<'locationValue'> & {
    value: ValueRuleValue<
        FieldNameType | BoundExpressionType | ValueRuleValue<CoordinateValueType>[]
    >;
};

export type ValueType = CommonType<'value'> &
    (
        | {
              value: string;
              valueType:
                  | 'null'
                  | 'boolean'
                  | 'string'
                  | 'integer'
                  | 'longText'
                  | 'date'
                  | 'time'
                  | 'dateTime'
                  | 'currency';
          }
        | {
              value: SignedNumberType;
              valueType: 'number';
          }
        | {
              value: DateFormulaType;
              valueType: 'dateFormula';
          }
        | {
              value: SubQueryType;
              valueType: 'subQuery';
          }
        | {
              value: ValueListType;
              valueType: 'list';
          }
        | {
              value: ValueRuleValue<BoundExpressionType>;
              valueType: 'bind';
          }
    );

export type WhenValueType = CommonType<'whenValue'> &
    (
        | {
              value: 'else';
          }
        | {
              value: ValueRuleValue<WhenLiteralType>[];
          }
        | {
              value: ValueRuleValue<IdType>;
              valueType: ValueRuleValue<TypeRefType>;
          }
    );

// ---------------------------------------------------------------------------
// variable
// ---------------------------------------------------------------------------

export type ArrayInitializerType = CommonType<'arrayInitializer'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export type VariableDeclaratorsType = CommonType<'variableDeclarators'> & {
    value: ValueRuleValue<VariableDeclaratorType>[];
};

export type VariableDeclaratorType = CommonType<'variableDeclarator'> & {
    value: ValueRuleValue<IdType>;
    init: ValueRuleValue<BaseExpressionType | null>;
};
