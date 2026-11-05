// 生成したファイル (lwc_IR と同じ生成スクリプト。@babel/types の NODE_FIELDS から作る)。手で直さない。
// lwc_IR のノードの CommonType (Apex の types/apex/converter の XxxType に当たる)。
// フィールドは Babel のフィールド名。子は ValueRuleValue<...> (IR を作れなかったところは ErrorType)、省略できるものは null
import type {
    ArrayPattern,
    ArrowFunctionExpression,
    AssignmentExpression,
    AssignmentPattern,
    BigIntLiteral,
    BigIntLiteralTypeAnnotation,
    BinaryExpression,
    BooleanLiteral,
    BooleanLiteralTypeAnnotation,
    ClassAccessorProperty,
    ClassDeclaration,
    ClassMethod,
    ClassPrivateMethod,
    ClassPrivateProperty,
    ClassProperty,
    DeclareExportAllDeclaration,
    DeclareExportDeclaration,
    DeclareModule,
    DirectiveLiteral,
    DoExpression,
    EnumBooleanBody,
    EnumNumberBody,
    EnumStringBody,
    EnumSymbolBody,
    ExportAllDeclaration,
    ExportDefaultDeclaration,
    ExportNamedDeclaration,
    ExportSpecifier,
    ForOfStatement,
    FunctionDeclaration,
    FunctionExpression,
    FunctionTypeParam,
    Identifier,
    ImportDeclaration,
    ImportExpression,
    ImportSpecifier,
    InterpreterDirective,
    JSXIdentifier,
    JSXOpeningElement,
    JSXText,
    LogicalExpression,
    MemberExpression,
    NumberLiteral,
    NumberLiteralTypeAnnotation,
    NumericLiteral,
    ObjectMethod,
    ObjectPattern,
    ObjectProperty,
    ObjectTypeAnnotation,
    ObjectTypeCallProperty,
    ObjectTypeIndexer,
    ObjectTypeInternalSlot,
    ObjectTypeProperty,
    OptionalCallExpression,
    OptionalIndexedAccessType,
    OptionalMemberExpression,
    Placeholder,
    Program,
    RegExpLiteral,
    RegexLiteral,
    RestElement,
    RestProperty,
    StringLiteral,
    StringLiteralTypeAnnotation,
    TSConstructorType,
    TSDeclareFunction,
    TSDeclareMethod,
    TSEnumDeclaration,
    TSImportEqualsDeclaration,
    TSIndexSignature,
    TSInterfaceDeclaration,
    TSMappedType,
    TSMethodSignature,
    TSModuleDeclaration,
    TSNamedTupleMember,
    TSParameterProperty,
    TSPropertySignature,
    TSTypeAliasDeclaration,
    TSTypeOperator,
    TSTypeParameter,
    TSTypePredicate,
    TemplateElement,
    TypeParameter,
    UnaryExpression,
    UpdateExpression,
    V8IntrinsicIdentifier,
    VariableDeclaration,
    VariableDeclarator,
    Variance,
    YieldExpression,
} from '@babel/types';

import type { CommonType, ValueRuleValue } from '../../commons/converter';
import type { LwcSourceInfo } from './commons';

/** ノードの CommonType (sourceInfo はファイルのパスも持つ) */
export type LwcNodeType<TName extends string> = CommonType<TName> & { sourceInfo: LwcSourceInfo };

export type LwcAnyTypeAnnotationType = LwcNodeType<'anyTypeAnnotation'>;

export type LwcArgumentPlaceholderType = LwcNodeType<'argumentPlaceholder'>;

export type LwcArrayExpressionType = LwcNodeType<'arrayExpression'> & {
    elements: (ValueRuleValue<LwcExpressionType | LwcSpreadElementType> | null)[];
};

export type LwcArrayPatternType = LwcNodeType<'arrayPattern'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<ArrayPattern['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    elements: (ValueRuleValue<LwcPatternLikeType> | null)[];
};

export type LwcArrayTypeAnnotationType = LwcNodeType<'arrayTypeAnnotation'> & {
    elementType: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcArrowFunctionExpressionType = LwcNodeType<'arrowFunctionExpression'> & {
    params: ValueRuleValue<LwcFunctionParameterType>[];
    generator: NonNullable<ArrowFunctionExpression['generator']> | null;
    async: ArrowFunctionExpression['async'];
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    expression: NonNullable<ArrowFunctionExpression['expression']> | null;
    body: ValueRuleValue<LwcBlockStatementType | LwcExpressionType>;
    predicate: ValueRuleValue<LwcFlowPredicateType> | null;
};

export type LwcAssignmentExpressionType = LwcNodeType<'assignmentExpression'> & {
    operator: AssignmentExpression['operator'];
    left: ValueRuleValue<
        | LwcIdentifierType
        | LwcMemberExpressionType
        | LwcOptionalMemberExpressionType
        | LwcArrayPatternType
        | LwcObjectPatternType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
    right: ValueRuleValue<LwcExpressionType>;
};

export type LwcAssignmentPatternType = LwcNodeType<'assignmentPattern'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<AssignmentPattern['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    left: ValueRuleValue<
        | LwcIdentifierType
        | LwcObjectPatternType
        | LwcArrayPatternType
        | LwcMemberExpressionType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
    right: ValueRuleValue<LwcExpressionType>;
};

export type LwcAwaitExpressionType = LwcNodeType<'awaitExpression'> & {
    argument: ValueRuleValue<LwcExpressionType>;
};

export type LwcBigIntLiteralType = LwcNodeType<'bigIntLiteral'> & {
    value: BigIntLiteral['value'];
};

export type LwcBigIntLiteralTypeAnnotationType = LwcNodeType<'bigIntLiteralTypeAnnotation'> & {
    value: BigIntLiteralTypeAnnotation['value'];
};

export type LwcBinaryExpressionType = LwcNodeType<'binaryExpression'> & {
    operator: BinaryExpression['operator'];
    left: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    right: ValueRuleValue<LwcExpressionType>;
};

export type LwcBlockStatementType = LwcNodeType<'blockStatement'> & {
    directives: ValueRuleValue<LwcDirectiveType>[];
    body: ValueRuleValue<LwcStatementType>[];
};

export type LwcBooleanLiteralType = LwcNodeType<'booleanLiteral'> & {
    value: BooleanLiteral['value'];
};

export type LwcBooleanLiteralTypeAnnotationType = LwcNodeType<'booleanLiteralTypeAnnotation'> & {
    value: BooleanLiteralTypeAnnotation['value'];
};

export type LwcBooleanTypeAnnotationType = LwcNodeType<'booleanTypeAnnotation'>;

export type LwcBreakStatementType = LwcNodeType<'breakStatement'> & {
    label: ValueRuleValue<LwcIdentifierType> | null;
};

export type LwcCallExpressionType = LwcNodeType<'callExpression'> & {
    callee: ValueRuleValue<
        LwcExpressionType | LwcSuperType | LwcImportType | LwcV8IntrinsicIdentifierType
    >;
    arguments: ValueRuleValue<
        LwcExpressionType | LwcSpreadElementType | LwcArgumentPlaceholderType
    >[];
    typeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
};

export type LwcCatchClauseType = LwcNodeType<'catchClause'> & {
    param: ValueRuleValue<LwcIdentifierType | LwcArrayPatternType | LwcObjectPatternType> | null;
    body: ValueRuleValue<LwcBlockStatementType>;
};

export type LwcClassAccessorPropertyType = LwcNodeType<'classAccessorProperty'> & {
    abstract: NonNullable<ClassAccessorProperty['abstract']> | null;
    accessibility: NonNullable<ClassAccessorProperty['accessibility']> | null;
    static: ClassAccessorProperty['static'];
    override: NonNullable<ClassAccessorProperty['override']> | null;
    computed: ClassAccessorProperty['computed'];
    optional: NonNullable<ClassAccessorProperty['optional']> | null;
    key: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    value: ValueRuleValue<LwcExpressionType> | null;
    definite: NonNullable<ClassAccessorProperty['definite']> | null;
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    readonly: NonNullable<ClassAccessorProperty['readonly']> | null;
    declare: NonNullable<ClassAccessorProperty['declare']> | null;
    variance: ValueRuleValue<LwcVarianceType> | null;
};

export type LwcClassDeclarationType = LwcNodeType<'classDeclaration'> & {
    id: ValueRuleValue<LwcIdentifierType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    body: ValueRuleValue<LwcClassBodyType>;
    superClass: ValueRuleValue<LwcExpressionType> | null;
    superTypeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
    implements: ValueRuleValue<LwcTSClassImplementsType | LwcClassImplementsType>[] | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    mixins: ValueRuleValue<LwcInterfaceExtendsType> | null;
    declare: NonNullable<ClassDeclaration['declare']> | null;
    abstract: NonNullable<ClassDeclaration['abstract']> | null;
};

export type LwcClassExpressionType = LwcNodeType<'classExpression'> & {
    id: ValueRuleValue<LwcIdentifierType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    body: ValueRuleValue<LwcClassBodyType>;
    superClass: ValueRuleValue<LwcExpressionType> | null;
    superTypeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
    implements: ValueRuleValue<LwcTSClassImplementsType | LwcClassImplementsType>[] | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    mixins: ValueRuleValue<LwcInterfaceExtendsType> | null;
};

export type LwcClassMethodType = LwcNodeType<'classMethod'> & {
    params: ValueRuleValue<LwcFunctionParameterType | LwcTSParameterPropertyType>[];
    generator: ClassMethod['generator'];
    async: ClassMethod['async'];
    abstract: NonNullable<ClassMethod['abstract']> | null;
    accessibility: NonNullable<ClassMethod['accessibility']> | null;
    static: ClassMethod['static'];
    override: NonNullable<ClassMethod['override']> | null;
    computed: ClassMethod['computed'];
    optional: NonNullable<ClassMethod['optional']> | null;
    key: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    kind: ClassMethod['kind'];
    access: NonNullable<ClassMethod['access']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    body: ValueRuleValue<LwcBlockStatementType>;
};

export type LwcClassPrivateMethodType = LwcNodeType<'classPrivateMethod'> & {
    params: ValueRuleValue<LwcFunctionParameterType | LwcTSParameterPropertyType>[];
    generator: ClassPrivateMethod['generator'];
    async: ClassPrivateMethod['async'];
    abstract: NonNullable<ClassPrivateMethod['abstract']> | null;
    accessibility: NonNullable<ClassPrivateMethod['accessibility']> | null;
    static: ClassPrivateMethod['static'];
    override: NonNullable<ClassPrivateMethod['override']> | null;
    computed: ClassPrivateMethod['computed'];
    optional: NonNullable<ClassPrivateMethod['optional']> | null;
    key: ValueRuleValue<LwcPrivateNameType>;
    kind: ClassPrivateMethod['kind'];
    access: NonNullable<ClassPrivateMethod['access']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    body: ValueRuleValue<LwcBlockStatementType>;
};

export type LwcClassPrivatePropertyType = LwcNodeType<'classPrivateProperty'> & {
    key: ValueRuleValue<LwcPrivateNameType>;
    value: ValueRuleValue<LwcExpressionType> | null;
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    static: ClassPrivateProperty['static'];
    readonly: NonNullable<ClassPrivateProperty['readonly']> | null;
    optional: NonNullable<ClassPrivateProperty['optional']> | null;
    definite: NonNullable<ClassPrivateProperty['definite']> | null;
    variance: ValueRuleValue<LwcVarianceType> | null;
};

export type LwcClassPropertyType = LwcNodeType<'classProperty'> & {
    abstract: NonNullable<ClassProperty['abstract']> | null;
    accessibility: NonNullable<ClassProperty['accessibility']> | null;
    static: ClassProperty['static'];
    override: NonNullable<ClassProperty['override']> | null;
    computed: ClassProperty['computed'];
    optional: NonNullable<ClassProperty['optional']> | null;
    key: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    value: ValueRuleValue<LwcExpressionType> | null;
    definite: NonNullable<ClassProperty['definite']> | null;
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    readonly: NonNullable<ClassProperty['readonly']> | null;
    declare: NonNullable<ClassProperty['declare']> | null;
    variance: ValueRuleValue<LwcVarianceType> | null;
};

export type LwcConditionalExpressionType = LwcNodeType<'conditionalExpression'> & {
    test: ValueRuleValue<LwcExpressionType>;
    consequent: ValueRuleValue<LwcExpressionType>;
    alternate: ValueRuleValue<LwcExpressionType>;
};

export type LwcContinueStatementType = LwcNodeType<'continueStatement'> & {
    label: ValueRuleValue<LwcIdentifierType> | null;
};

export type LwcDebuggerStatementType = LwcNodeType<'debuggerStatement'>;

export type LwcDeclareClassType = LwcNodeType<'declareClass'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    extends: ValueRuleValue<LwcInterfaceExtendsType>[] | null;
    mixins: ValueRuleValue<LwcInterfaceExtendsType>[] | null;
    implements: ValueRuleValue<LwcClassImplementsType>[] | null;
    body: ValueRuleValue<LwcObjectTypeAnnotationType>;
};

export type LwcDeclaredPredicateType = LwcNodeType<'declaredPredicate'> & {
    value: ValueRuleValue<LwcExpressionType>;
};

export type LwcDeclareExportAllDeclarationType = LwcNodeType<'declareExportAllDeclaration'> & {
    source: ValueRuleValue<LwcStringLiteralType>;
    exportKind: NonNullable<DeclareExportAllDeclaration['exportKind']> | null;
    attributes: ValueRuleValue<LwcImportAttributeType>[] | null;
};

export type LwcDeclareExportDeclarationType = LwcNodeType<'declareExportDeclaration'> & {
    declaration: ValueRuleValue<LwcFlowType> | null;
    specifiers: ValueRuleValue<LwcExportSpecifierType | LwcExportNamespaceSpecifierType>[] | null;
    source: ValueRuleValue<LwcStringLiteralType> | null;
    default: NonNullable<DeclareExportDeclaration['default']> | null;
    attributes: ValueRuleValue<LwcImportAttributeType>[] | null;
};

export type LwcDeclareFunctionType = LwcNodeType<'declareFunction'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    predicate: ValueRuleValue<LwcFlowPredicateType> | null;
};

export type LwcDeclareInterfaceType = LwcNodeType<'declareInterface'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    extends: ValueRuleValue<LwcInterfaceExtendsType>[] | null;
    body: ValueRuleValue<LwcObjectTypeAnnotationType>;
};

export type LwcDeclareModuleType = LwcNodeType<'declareModule'> & {
    id: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    body: ValueRuleValue<LwcBlockStatementType>;
    kind: NonNullable<DeclareModule['kind']> | null;
};

export type LwcDeclareModuleExportsType = LwcNodeType<'declareModuleExports'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType>;
};

export type LwcDeclareOpaqueTypeType = LwcNodeType<'declareOpaqueType'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    supertype: ValueRuleValue<LwcFlowTypeType> | null;
    impltype: ValueRuleValue<LwcFlowTypeType> | null;
};

export type LwcDeclareTypeAliasType = LwcNodeType<'declareTypeAlias'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    right: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcDeclareVariableType = LwcNodeType<'declareVariable'> & {
    id: ValueRuleValue<LwcIdentifierType>;
};

export type LwcDecoratorType = LwcNodeType<'decorator'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcDoWhileStatementType = LwcNodeType<'doWhileStatement'> & {
    test: ValueRuleValue<LwcExpressionType>;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcEmptyStatementType = LwcNodeType<'emptyStatement'>;

export type LwcEmptyTypeAnnotationType = LwcNodeType<'emptyTypeAnnotation'>;

export type LwcEnumBooleanBodyType = LwcNodeType<'enumBooleanBody'> & {
    explicitType: EnumBooleanBody['explicitType'];
    hasUnknownMembers: EnumBooleanBody['hasUnknownMembers'];
    members: ValueRuleValue<LwcEnumBooleanMemberType>[];
};

export type LwcEnumBooleanMemberType = LwcNodeType<'enumBooleanMember'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    init: ValueRuleValue<LwcBooleanLiteralType>;
};

export type LwcEnumDeclarationType = LwcNodeType<'enumDeclaration'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    body: ValueRuleValue<
        | LwcEnumBooleanBodyType
        | LwcEnumNumberBodyType
        | LwcEnumStringBodyType
        | LwcEnumSymbolBodyType
    >;
};

export type LwcEnumDefaultedMemberType = LwcNodeType<'enumDefaultedMember'> & {
    id: ValueRuleValue<LwcIdentifierType>;
};

export type LwcEnumNumberBodyType = LwcNodeType<'enumNumberBody'> & {
    explicitType: EnumNumberBody['explicitType'];
    hasUnknownMembers: EnumNumberBody['hasUnknownMembers'];
    members: ValueRuleValue<LwcEnumNumberMemberType>[];
};

export type LwcEnumNumberMemberType = LwcNodeType<'enumNumberMember'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    init: ValueRuleValue<LwcNumericLiteralType>;
};

export type LwcEnumStringBodyType = LwcNodeType<'enumStringBody'> & {
    explicitType: EnumStringBody['explicitType'];
    hasUnknownMembers: EnumStringBody['hasUnknownMembers'];
    members: ValueRuleValue<LwcEnumStringMemberType | LwcEnumDefaultedMemberType>[];
};

export type LwcEnumStringMemberType = LwcNodeType<'enumStringMember'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    init: ValueRuleValue<LwcStringLiteralType>;
};

export type LwcEnumSymbolBodyType = LwcNodeType<'enumSymbolBody'> & {
    members: ValueRuleValue<LwcEnumDefaultedMemberType>[];
    hasUnknownMembers: EnumSymbolBody['hasUnknownMembers'];
};

export type LwcExistsTypeAnnotationType = LwcNodeType<'existsTypeAnnotation'>;

export type LwcExportAllDeclarationType = LwcNodeType<'exportAllDeclaration'> & {
    source: ValueRuleValue<LwcStringLiteralType>;
    exportKind: NonNullable<ExportAllDeclaration['exportKind']> | null;
    attributes: ValueRuleValue<LwcImportAttributeType>[] | null;
};

export type LwcExportDefaultDeclarationType = LwcNodeType<'exportDefaultDeclaration'> & {
    declaration: ValueRuleValue<
        | LwcFunctionDeclarationType
        | LwcClassDeclarationType
        | LwcExpressionType
        | LwcTSDeclareFunctionType
        | LwcTSInterfaceDeclarationType
        | LwcEnumDeclarationType
    >;
    exportKind: NonNullable<ExportDefaultDeclaration['exportKind']> | null;
};

export type LwcExportNamedDeclarationType = LwcNodeType<'exportNamedDeclaration'> & {
    declaration: ValueRuleValue<LwcDeclarationType> | null;
    attributes: ValueRuleValue<LwcImportAttributeType>[] | null;
    specifiers: ValueRuleValue<
        LwcExportSpecifierType | LwcExportDefaultSpecifierType | LwcExportNamespaceSpecifierType
    >[];
    source: ValueRuleValue<LwcStringLiteralType> | null;
    exportKind: NonNullable<ExportNamedDeclaration['exportKind']> | null;
};

export type LwcExportNamespaceSpecifierType = LwcNodeType<'exportNamespaceSpecifier'> & {
    exported: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
};

export type LwcExportSpecifierType = LwcNodeType<'exportSpecifier'> & {
    local: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    exported: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    exportKind: NonNullable<ExportSpecifier['exportKind']> | null;
};

export type LwcExpressionStatementType = LwcNodeType<'expressionStatement'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcForInStatementType = LwcNodeType<'forInStatement'> & {
    left: ValueRuleValue<
        | LwcVariableDeclarationType
        | LwcIdentifierType
        | LwcMemberExpressionType
        | LwcArrayPatternType
        | LwcObjectPatternType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
    right: ValueRuleValue<LwcExpressionType>;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcForOfStatementType = LwcNodeType<'forOfStatement'> & {
    left: ValueRuleValue<
        | LwcVariableDeclarationType
        | LwcIdentifierType
        | LwcMemberExpressionType
        | LwcArrayPatternType
        | LwcObjectPatternType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
    right: ValueRuleValue<LwcExpressionType>;
    body: ValueRuleValue<LwcStatementType>;
    await: ForOfStatement['await'];
};

export type LwcForStatementType = LwcNodeType<'forStatement'> & {
    init: ValueRuleValue<LwcVariableDeclarationType | LwcExpressionType> | null;
    test: ValueRuleValue<LwcExpressionType> | null;
    update: ValueRuleValue<LwcExpressionType> | null;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcFunctionDeclarationType = LwcNodeType<'functionDeclaration'> & {
    params: ValueRuleValue<LwcFunctionParameterType>[];
    generator: FunctionDeclaration['generator'];
    async: FunctionDeclaration['async'];
    declare: NonNullable<FunctionDeclaration['declare']> | null;
    id: ValueRuleValue<LwcIdentifierType> | null;
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    body: ValueRuleValue<LwcBlockStatementType>;
    predicate: ValueRuleValue<LwcFlowPredicateType> | null;
};

export type LwcFunctionExpressionType = LwcNodeType<'functionExpression'> & {
    params: ValueRuleValue<LwcFunctionParameterType>[];
    generator: FunctionExpression['generator'];
    async: FunctionExpression['async'];
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    id: ValueRuleValue<LwcIdentifierType> | null;
    body: ValueRuleValue<LwcBlockStatementType>;
    predicate: ValueRuleValue<LwcFlowPredicateType> | null;
};

export type LwcFunctionTypeAnnotationType = LwcNodeType<'functionTypeAnnotation'> & {
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    params: ValueRuleValue<LwcFunctionTypeParamType>[];
    rest: ValueRuleValue<LwcFunctionTypeParamType> | null;
    this: ValueRuleValue<LwcFunctionTypeParamType> | null;
    returnType: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcGenericTypeAnnotationType = LwcNodeType<'genericTypeAnnotation'> & {
    id: ValueRuleValue<LwcIdentifierType | LwcQualifiedTypeIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterInstantiationType> | null;
};

export type LwcIdentifierType = LwcNodeType<'identifier'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<Identifier['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    name: Identifier['name'];
};

export type LwcIfStatementType = LwcNodeType<'ifStatement'> & {
    test: ValueRuleValue<LwcExpressionType>;
    consequent: ValueRuleValue<LwcStatementType>;
    alternate: ValueRuleValue<LwcStatementType> | null;
};

export type LwcImportDeclarationType = LwcNodeType<'importDeclaration'> & {
    attributes: ValueRuleValue<LwcImportAttributeType>[] | null;
    module: NonNullable<ImportDeclaration['module']> | null;
    phase: NonNullable<ImportDeclaration['phase']> | null;
    specifiers: ValueRuleValue<
        LwcImportSpecifierType | LwcImportDefaultSpecifierType | LwcImportNamespaceSpecifierType
    >[];
    source: ValueRuleValue<LwcStringLiteralType>;
    importKind: NonNullable<ImportDeclaration['importKind']> | null;
};

export type LwcImportDefaultSpecifierType = LwcNodeType<'importDefaultSpecifier'> & {
    local: ValueRuleValue<LwcIdentifierType>;
};

export type LwcImportExpressionType = LwcNodeType<'importExpression'> & {
    phase: NonNullable<ImportExpression['phase']> | null;
    source: ValueRuleValue<LwcExpressionType>;
    options: ValueRuleValue<LwcExpressionType> | null;
};

export type LwcImportNamespaceSpecifierType = LwcNodeType<'importNamespaceSpecifier'> & {
    local: ValueRuleValue<LwcIdentifierType>;
};

export type LwcImportSpecifierType = LwcNodeType<'importSpecifier'> & {
    local: ValueRuleValue<LwcIdentifierType>;
    imported: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    importKind: NonNullable<ImportSpecifier['importKind']> | null;
};

export type LwcIndexedAccessTypeType = LwcNodeType<'indexedAccessType'> & {
    objectType: ValueRuleValue<LwcFlowTypeType>;
    indexType: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcInferredPredicateType = LwcNodeType<'inferredPredicate'>;

export type LwcInterfaceDeclarationType = LwcNodeType<'interfaceDeclaration'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    extends: ValueRuleValue<LwcInterfaceExtendsType>[] | null;
    body: ValueRuleValue<LwcObjectTypeAnnotationType>;
};

export type LwcInterfaceTypeAnnotationType = LwcNodeType<'interfaceTypeAnnotation'> & {
    extends: ValueRuleValue<LwcInterfaceExtendsType>[] | null;
    body: ValueRuleValue<LwcObjectTypeAnnotationType>;
};

export type LwcIntersectionTypeAnnotationType = LwcNodeType<'intersectionTypeAnnotation'> & {
    types: ValueRuleValue<LwcFlowTypeType>[];
};

export type LwcJSXAttributeType = LwcNodeType<'jSXAttribute'> & {
    name: ValueRuleValue<LwcJSXIdentifierType | LwcJSXNamespacedNameType>;
    value: ValueRuleValue<
        | LwcJSXElementType
        | LwcJSXFragmentType
        | LwcStringLiteralType
        | LwcJSXExpressionContainerType
    > | null;
};

export type LwcJSXClosingElementType = LwcNodeType<'jSXClosingElement'> & {
    name: ValueRuleValue<
        LwcJSXIdentifierType | LwcJSXMemberExpressionType | LwcJSXNamespacedNameType
    >;
};

export type LwcJSXClosingFragmentType = LwcNodeType<'jSXClosingFragment'>;

export type LwcJSXElementType = LwcNodeType<'jSXElement'> & {
    openingElement: ValueRuleValue<LwcJSXOpeningElementType>;
    closingElement: ValueRuleValue<LwcJSXClosingElementType> | null;
    children: ValueRuleValue<
        | LwcJSXTextType
        | LwcJSXExpressionContainerType
        | LwcJSXSpreadChildType
        | LwcJSXElementType
        | LwcJSXFragmentType
    >[];
};

export type LwcJSXExpressionContainerType = LwcNodeType<'jSXExpressionContainer'> & {
    expression: ValueRuleValue<LwcExpressionType | LwcJSXEmptyExpressionType>;
};

export type LwcJSXFragmentType = LwcNodeType<'jSXFragment'> & {
    openingFragment: ValueRuleValue<LwcJSXOpeningFragmentType>;
    closingFragment: ValueRuleValue<LwcJSXClosingFragmentType>;
    children: ValueRuleValue<
        | LwcJSXTextType
        | LwcJSXExpressionContainerType
        | LwcJSXSpreadChildType
        | LwcJSXElementType
        | LwcJSXFragmentType
    >[];
};

export type LwcJSXOpeningElementType = LwcNodeType<'jSXOpeningElement'> & {
    name: ValueRuleValue<
        LwcJSXIdentifierType | LwcJSXMemberExpressionType | LwcJSXNamespacedNameType
    >;
    selfClosing: JSXOpeningElement['selfClosing'];
    attributes: ValueRuleValue<LwcJSXAttributeType | LwcJSXSpreadAttributeType>[];
    typeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
};

export type LwcJSXOpeningFragmentType = LwcNodeType<'jSXOpeningFragment'>;

export type LwcJSXSpreadChildType = LwcNodeType<'jSXSpreadChild'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcJSXTextType = LwcNodeType<'jSXText'> & {
    value: JSXText['value'];
};

export type LwcLabeledStatementType = LwcNodeType<'labeledStatement'> & {
    label: ValueRuleValue<LwcIdentifierType>;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcLogicalExpressionType = LwcNodeType<'logicalExpression'> & {
    operator: LogicalExpression['operator'];
    left: ValueRuleValue<LwcExpressionType>;
    right: ValueRuleValue<LwcExpressionType>;
};

export type LwcMemberExpressionType = LwcNodeType<'memberExpression'> & {
    object: ValueRuleValue<LwcExpressionType | LwcSuperType>;
    property: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    computed: MemberExpression['computed'];
};

export type LwcMetaPropertyType = LwcNodeType<'metaProperty'> & {
    meta: ValueRuleValue<LwcIdentifierType>;
    property: ValueRuleValue<LwcIdentifierType>;
};

export type LwcMixedTypeAnnotationType = LwcNodeType<'mixedTypeAnnotation'>;

export type LwcNewExpressionType = LwcNodeType<'newExpression'> & {
    callee: ValueRuleValue<LwcExpressionType | LwcV8IntrinsicIdentifierType>;
    arguments: ValueRuleValue<
        LwcExpressionType | LwcSpreadElementType | LwcArgumentPlaceholderType
    >[];
    typeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
};

export type LwcNullableTypeAnnotationType = LwcNodeType<'nullableTypeAnnotation'> & {
    typeAnnotation: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcNullLiteralType = LwcNodeType<'nullLiteral'>;

export type LwcNullLiteralTypeAnnotationType = LwcNodeType<'nullLiteralTypeAnnotation'>;

export type LwcNumberLiteralType = LwcNodeType<'numberLiteral'> & {
    value: NumberLiteral['value'];
};

export type LwcNumberLiteralTypeAnnotationType = LwcNodeType<'numberLiteralTypeAnnotation'> & {
    value: NumberLiteralTypeAnnotation['value'];
};

export type LwcNumberTypeAnnotationType = LwcNodeType<'numberTypeAnnotation'>;

export type LwcNumericLiteralType = LwcNodeType<'numericLiteral'> & {
    value: NumericLiteral['value'];
};

export type LwcObjectExpressionType = LwcNodeType<'objectExpression'> & {
    properties: ValueRuleValue<
        LwcObjectMethodType | LwcObjectPropertyType | LwcSpreadElementType
    >[];
};

export type LwcObjectMethodType = LwcNodeType<'objectMethod'> & {
    params: ValueRuleValue<LwcFunctionParameterType>[];
    generator: ObjectMethod['generator'];
    async: ObjectMethod['async'];
    returnType: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<
        LwcTypeParameterDeclarationType | LwcTSTypeParameterDeclarationType
    > | null;
    kind: ObjectMethod['kind'];
    computed: ObjectMethod['computed'];
    key: ValueRuleValue<LwcExpressionType>;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    body: ValueRuleValue<LwcBlockStatementType>;
};

export type LwcObjectPatternType = LwcNodeType<'objectPattern'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<ObjectPattern['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    properties: ValueRuleValue<LwcRestElementType | LwcObjectPropertyType>[];
};

export type LwcObjectPropertyType = LwcNodeType<'objectProperty'> & {
    computed: ObjectProperty['computed'];
    key: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    value: ValueRuleValue<LwcExpressionType | LwcPatternLikeType>;
    shorthand: ObjectProperty['shorthand'];
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
};

export type LwcObjectTypeAnnotationType = LwcNodeType<'objectTypeAnnotation'> & {
    properties: ValueRuleValue<LwcObjectTypePropertyType | LwcObjectTypeSpreadPropertyType>[];
    indexers: ValueRuleValue<LwcObjectTypeIndexerType>[];
    callProperties: ValueRuleValue<LwcObjectTypeCallPropertyType>[];
    internalSlots: ValueRuleValue<LwcObjectTypeInternalSlotType>[];
    exact: ObjectTypeAnnotation['exact'];
    inexact: NonNullable<ObjectTypeAnnotation['inexact']> | null;
};

export type LwcObjectTypeCallPropertyType = LwcNodeType<'objectTypeCallProperty'> & {
    value: ValueRuleValue<LwcFlowTypeType>;
    static: ObjectTypeCallProperty['static'];
};

export type LwcObjectTypeIndexerType = LwcNodeType<'objectTypeIndexer'> & {
    id: ValueRuleValue<LwcIdentifierType> | null;
    key: ValueRuleValue<LwcFlowTypeType>;
    value: ValueRuleValue<LwcFlowTypeType>;
    static: ObjectTypeIndexer['static'];
    variance: ValueRuleValue<LwcVarianceType> | null;
};

export type LwcObjectTypeInternalSlotType = LwcNodeType<'objectTypeInternalSlot'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    value: ValueRuleValue<LwcFlowTypeType>;
    optional: ObjectTypeInternalSlot['optional'];
    static: ObjectTypeInternalSlot['static'];
    method: ObjectTypeInternalSlot['method'];
};

export type LwcObjectTypePropertyType = LwcNodeType<'objectTypeProperty'> & {
    key: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType | LwcNumericLiteralType>;
    value: ValueRuleValue<LwcFlowTypeType>;
    kind: ObjectTypeProperty['kind'];
    static: ObjectTypeProperty['static'];
    proto: ObjectTypeProperty['proto'];
    optional: ObjectTypeProperty['optional'];
    variance: ValueRuleValue<LwcVarianceType> | null;
    method: ObjectTypeProperty['method'];
};

export type LwcObjectTypeSpreadPropertyType = LwcNodeType<'objectTypeSpreadProperty'> & {
    argument: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcOpaqueTypeType = LwcNodeType<'opaqueType'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    supertype: ValueRuleValue<LwcFlowTypeType> | null;
    impltype: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcOptionalCallExpressionType = LwcNodeType<'optionalCallExpression'> & {
    callee: ValueRuleValue<LwcExpressionType>;
    arguments: ValueRuleValue<
        LwcExpressionType | LwcSpreadElementType | LwcArgumentPlaceholderType
    >[];
    optional: OptionalCallExpression['optional'];
    typeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
};

export type LwcOptionalIndexedAccessTypeType = LwcNodeType<'optionalIndexedAccessType'> & {
    objectType: ValueRuleValue<LwcFlowTypeType>;
    indexType: ValueRuleValue<LwcFlowTypeType>;
    optional: OptionalIndexedAccessType['optional'];
};

export type LwcOptionalMemberExpressionType = LwcNodeType<'optionalMemberExpression'> & {
    object: ValueRuleValue<LwcExpressionType>;
    property: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    computed: OptionalMemberExpression['computed'];
    optional: OptionalMemberExpression['optional'];
};

export type LwcParenthesizedExpressionType = LwcNodeType<'parenthesizedExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcPrivateNameType = LwcNodeType<'privateName'> & {
    id: ValueRuleValue<LwcIdentifierType>;
};

export type LwcProgramType = LwcNodeType<'program'> & {
    sourceType: Program['sourceType'];
    interpreter: ValueRuleValue<LwcInterpreterDirectiveType> | null;
    directives: ValueRuleValue<LwcDirectiveType>[];
    body: ValueRuleValue<LwcStatementType>[];
};

export type LwcRegexLiteralType = LwcNodeType<'regexLiteral'> & {
    pattern: RegexLiteral['pattern'];
    flags: RegexLiteral['flags'];
};

export type LwcRegExpLiteralType = LwcNodeType<'regExpLiteral'> & {
    pattern: RegExpLiteral['pattern'];
    flags: RegExpLiteral['flags'];
};

export type LwcRestElementType = LwcNodeType<'restElement'> & {
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<RestElement['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    argument: ValueRuleValue<
        | LwcIdentifierType
        | LwcArrayPatternType
        | LwcObjectPatternType
        | LwcMemberExpressionType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
};

export type LwcRestPropertyType = LwcNodeType<'restProperty'> & {
    argument: ValueRuleValue<
        | LwcIdentifierType
        | LwcArrayPatternType
        | LwcObjectPatternType
        | LwcMemberExpressionType
        | LwcTSAsExpressionType
        | LwcTSSatisfiesExpressionType
        | LwcTSTypeAssertionType
        | LwcTSNonNullExpressionType
    >;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
    optional: NonNullable<RestProperty['optional']> | null;
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
};

export type LwcReturnStatementType = LwcNodeType<'returnStatement'> & {
    argument: ValueRuleValue<LwcExpressionType> | null;
};

export type LwcSequenceExpressionType = LwcNodeType<'sequenceExpression'> & {
    expressions: ValueRuleValue<LwcExpressionType>[];
};

export type LwcSpreadElementType = LwcNodeType<'spreadElement'> & {
    argument: ValueRuleValue<LwcExpressionType>;
};

export type LwcSpreadPropertyType = LwcNodeType<'spreadProperty'> & {
    argument: ValueRuleValue<LwcExpressionType>;
};

export type LwcStaticBlockType = LwcNodeType<'staticBlock'> & {
    body: ValueRuleValue<LwcStatementType>[];
};

export type LwcStringLiteralType = LwcNodeType<'stringLiteral'> & {
    value: StringLiteral['value'];
};

export type LwcStringLiteralTypeAnnotationType = LwcNodeType<'stringLiteralTypeAnnotation'> & {
    value: StringLiteralTypeAnnotation['value'];
};

export type LwcStringTypeAnnotationType = LwcNodeType<'stringTypeAnnotation'>;

export type LwcSwitchStatementType = LwcNodeType<'switchStatement'> & {
    discriminant: ValueRuleValue<LwcExpressionType>;
    cases: ValueRuleValue<LwcSwitchCaseType>[];
};

export type LwcSymbolTypeAnnotationType = LwcNodeType<'symbolTypeAnnotation'>;

export type LwcTaggedTemplateExpressionType = LwcNodeType<'taggedTemplateExpression'> & {
    tag: ValueRuleValue<LwcExpressionType>;
    quasi: ValueRuleValue<LwcTemplateLiteralType>;
    typeArguments: ValueRuleValue<
        LwcTypeParameterInstantiationType | LwcTSTypeParameterInstantiationType
    > | null;
};

export type LwcTemplateLiteralType = LwcNodeType<'templateLiteral'> & {
    quasis: ValueRuleValue<LwcTemplateElementType>[];
    expressions: ValueRuleValue<LwcExpressionType | LwcTSTypeType>[];
};

export type LwcThisExpressionType = LwcNodeType<'thisExpression'>;

export type LwcThisTypeAnnotationType = LwcNodeType<'thisTypeAnnotation'>;

export type LwcThrowStatementType = LwcNodeType<'throwStatement'> & {
    argument: ValueRuleValue<LwcExpressionType>;
};

export type LwcTryStatementType = LwcNodeType<'tryStatement'> & {
    block: ValueRuleValue<LwcBlockStatementType>;
    handler: ValueRuleValue<LwcCatchClauseType> | null;
    finalizer: ValueRuleValue<LwcBlockStatementType> | null;
};

export type LwcTSAnyKeywordType = LwcNodeType<'tSAnyKeyword'>;

export type LwcTSArrayTypeType = LwcNodeType<'tSArrayType'> & {
    elementType: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSAsExpressionType = LwcNodeType<'tSAsExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSBigIntKeywordType = LwcNodeType<'tSBigIntKeyword'>;

export type LwcTSBooleanKeywordType = LwcNodeType<'tSBooleanKeyword'>;

export type LwcTSCallSignatureDeclarationType = LwcNodeType<'tSCallSignatureDeclaration'> & {
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    params: ValueRuleValue<
        LwcArrayPatternType | LwcIdentifierType | LwcObjectPatternType | LwcRestElementType
    >[];
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
};

export type LwcTSClassImplementsType = LwcNodeType<'tSClassImplements'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
};

export type LwcTSConditionalTypeType = LwcNodeType<'tSConditionalType'> & {
    checkType: ValueRuleValue<LwcTSTypeType>;
    extendsType: ValueRuleValue<LwcTSTypeType>;
    trueType: ValueRuleValue<LwcTSTypeType>;
    falseType: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSConstructorTypeType = LwcNodeType<'tSConstructorType'> & {
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    params: ValueRuleValue<
        LwcArrayPatternType | LwcIdentifierType | LwcObjectPatternType | LwcRestElementType
    >[];
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    abstract: NonNullable<TSConstructorType['abstract']> | null;
};

export type LwcTSConstructSignatureDeclarationType =
    LwcNodeType<'tSConstructSignatureDeclaration'> & {
        typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
        params: ValueRuleValue<
            LwcArrayPatternType | LwcIdentifierType | LwcObjectPatternType | LwcRestElementType
        >[];
        returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    };

export type LwcTSDeclareFunctionType = LwcNodeType<'tSDeclareFunction'> & {
    params: ValueRuleValue<LwcFunctionParameterType>[];
    generator: TSDeclareFunction['generator'];
    async: TSDeclareFunction['async'];
    declare: NonNullable<TSDeclareFunction['declare']> | null;
    id: ValueRuleValue<LwcIdentifierType> | null;
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
};

export type LwcTSEnumDeclarationType = LwcNodeType<'tSEnumDeclaration'> & {
    declare: NonNullable<TSEnumDeclaration['declare']> | null;
    const: NonNullable<TSEnumDeclaration['const']> | null;
    id: ValueRuleValue<LwcIdentifierType>;
    body: ValueRuleValue<LwcTSEnumBodyType>;
};

export type LwcTSExportAssignmentType = LwcNodeType<'tSExportAssignment'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcTSFunctionTypeType = LwcNodeType<'tSFunctionType'> & {
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    params: ValueRuleValue<
        LwcArrayPatternType | LwcIdentifierType | LwcObjectPatternType | LwcRestElementType
    >[];
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
};

export type LwcTSImportEqualsDeclarationType = LwcNodeType<'tSImportEqualsDeclaration'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    moduleReference: ValueRuleValue<LwcTSEntityNameType | LwcTSExternalModuleReferenceType>;
    importKind: NonNullable<TSImportEqualsDeclaration['importKind']> | null;
};

export type LwcTSImportTypeType = LwcNodeType<'tSImportType'> & {
    source: ValueRuleValue<LwcStringLiteralType>;
    qualifier: ValueRuleValue<LwcTSEntityNameType> | null;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
    options: ValueRuleValue<LwcObjectExpressionType> | null;
};

export type LwcTSIndexedAccessTypeType = LwcNodeType<'tSIndexedAccessType'> & {
    objectType: ValueRuleValue<LwcTSTypeType>;
    indexType: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSIndexSignatureType = LwcNodeType<'tSIndexSignature'> & {
    readonly: NonNullable<TSIndexSignature['readonly']> | null;
    static: NonNullable<TSIndexSignature['static']> | null;
    parameters: ValueRuleValue<LwcIdentifierType>[];
    typeAnnotation: ValueRuleValue<LwcTSTypeAnnotationType> | null;
};

export type LwcTSInferTypeType = LwcNodeType<'tSInferType'> & {
    typeParameter: ValueRuleValue<LwcTSTypeParameterType>;
};

export type LwcTSInstantiationExpressionType = LwcNodeType<'tSInstantiationExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
};

export type LwcTSInterfaceDeclarationType = LwcNodeType<'tSInterfaceDeclaration'> & {
    declare: NonNullable<TSInterfaceDeclaration['declare']> | null;
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    extends: ValueRuleValue<LwcTSInterfaceHeritageType>[] | null;
    body: ValueRuleValue<LwcTSInterfaceBodyType>;
};

export type LwcTSInterfaceHeritageType = LwcNodeType<'tSInterfaceHeritage'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
};

export type LwcTSIntersectionTypeType = LwcNodeType<'tSIntersectionType'> & {
    types: ValueRuleValue<LwcTSTypeType>[];
};

export type LwcTSIntrinsicKeywordType = LwcNodeType<'tSIntrinsicKeyword'>;

export type LwcTSLiteralTypeType = LwcNodeType<'tSLiteralType'> & {
    literal: ValueRuleValue<
        | LwcNumericLiteralType
        | LwcStringLiteralType
        | LwcBooleanLiteralType
        | LwcBigIntLiteralType
        | LwcTemplateLiteralType
        | LwcUnaryExpressionType
    >;
};

export type LwcTSMappedTypeType = LwcNodeType<'tSMappedType'> & {
    key: ValueRuleValue<LwcIdentifierType>;
    constraint: ValueRuleValue<LwcTSTypeType>;
    readonly: NonNullable<TSMappedType['readonly']> | null;
    optional: NonNullable<TSMappedType['optional']> | null;
    typeAnnotation: ValueRuleValue<LwcTSTypeType> | null;
    nameType: ValueRuleValue<LwcTSTypeType> | null;
};

export type LwcTSMethodSignatureType = LwcNodeType<'tSMethodSignature'> & {
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    params: ValueRuleValue<
        LwcArrayPatternType | LwcIdentifierType | LwcObjectPatternType | LwcRestElementType
    >[];
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    key: ValueRuleValue<LwcExpressionType>;
    computed: TSMethodSignature['computed'];
    optional: NonNullable<TSMethodSignature['optional']> | null;
    kind: TSMethodSignature['kind'];
};

export type LwcTSModuleBlockType = LwcNodeType<'tSModuleBlock'> & {
    body: ValueRuleValue<LwcStatementType>[];
};

export type LwcTSModuleDeclarationType = LwcNodeType<'tSModuleDeclaration'> & {
    kind: TSModuleDeclaration['kind'];
    declare: NonNullable<TSModuleDeclaration['declare']> | null;
    id: ValueRuleValue<LwcTSEntityNameType | LwcStringLiteralType>;
    body: ValueRuleValue<LwcTSModuleBlockType>;
};

export type LwcTSNamedTupleMemberType = LwcNodeType<'tSNamedTupleMember'> & {
    label: ValueRuleValue<LwcIdentifierType>;
    optional: TSNamedTupleMember['optional'];
    elementType: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSNamespaceExportDeclarationType = LwcNodeType<'tSNamespaceExportDeclaration'> & {
    id: ValueRuleValue<LwcIdentifierType>;
};

export type LwcTSNeverKeywordType = LwcNodeType<'tSNeverKeyword'>;

export type LwcTSNonNullExpressionType = LwcNodeType<'tSNonNullExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcTSNullKeywordType = LwcNodeType<'tSNullKeyword'>;

export type LwcTSNumberKeywordType = LwcNodeType<'tSNumberKeyword'>;

export type LwcTSObjectKeywordType = LwcNodeType<'tSObjectKeyword'>;

export type LwcTSOptionalTypeType = LwcNodeType<'tSOptionalType'> & {
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSParenthesizedTypeType = LwcNodeType<'tSParenthesizedType'> & {
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSPropertySignatureType = LwcNodeType<'tSPropertySignature'> & {
    key: ValueRuleValue<LwcExpressionType>;
    computed: TSPropertySignature['computed'];
    optional: NonNullable<TSPropertySignature['optional']> | null;
    readonly: NonNullable<TSPropertySignature['readonly']> | null;
    typeAnnotation: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    kind: NonNullable<TSPropertySignature['kind']> | null;
};

export type LwcTSQualifiedNameType = LwcNodeType<'tSQualifiedName'> & {
    left: ValueRuleValue<LwcTSEntityNameType>;
    right: ValueRuleValue<LwcIdentifierType>;
};

export type LwcTSRestTypeType = LwcNodeType<'tSRestType'> & {
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSSatisfiesExpressionType = LwcNodeType<'tSSatisfiesExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSStringKeywordType = LwcNodeType<'tSStringKeyword'>;

export type LwcTSSymbolKeywordType = LwcNodeType<'tSSymbolKeyword'>;

export type LwcTSTemplateLiteralTypeType = LwcNodeType<'tSTemplateLiteralType'> & {
    quasis: ValueRuleValue<LwcTemplateElementType>[];
    types: ValueRuleValue<LwcTSTypeType>[];
};

export type LwcTSThisTypeType = LwcNodeType<'tSThisType'>;

export type LwcTSTupleTypeType = LwcNodeType<'tSTupleType'> & {
    elementTypes: ValueRuleValue<LwcTSTypeType>[];
};

export type LwcTSTypeAliasDeclarationType = LwcNodeType<'tSTypeAliasDeclaration'> & {
    declare: NonNullable<TSTypeAliasDeclaration['declare']> | null;
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSTypeAssertionType = LwcNodeType<'tSTypeAssertion'> & {
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
    expression: ValueRuleValue<LwcExpressionType>;
};

export type LwcTSTypeLiteralType = LwcNodeType<'tSTypeLiteral'> & {
    members: ValueRuleValue<LwcTSTypeElementType>[];
};

export type LwcTSTypeOperatorType = LwcNodeType<'tSTypeOperator'> & {
    operator: TSTypeOperator['operator'];
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSTypePredicateType = LwcNodeType<'tSTypePredicate'> & {
    parameterName: ValueRuleValue<LwcIdentifierType | LwcTSThisTypeType>;
    typeAnnotation: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    asserts: NonNullable<TSTypePredicate['asserts']> | null;
};

export type LwcTSTypeQueryType = LwcNodeType<'tSTypeQuery'> & {
    exprName: ValueRuleValue<LwcTSEntityNameType | LwcTSImportTypeType>;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
};

export type LwcTSTypeReferenceType = LwcNodeType<'tSTypeReference'> & {
    typeName: ValueRuleValue<LwcTSEntityNameType>;
    typeArguments: ValueRuleValue<LwcTSTypeParameterInstantiationType> | null;
};

export type LwcTSUndefinedKeywordType = LwcNodeType<'tSUndefinedKeyword'>;

export type LwcTSUnionTypeType = LwcNodeType<'tSUnionType'> & {
    types: ValueRuleValue<LwcTSTypeType>[];
};

export type LwcTSUnknownKeywordType = LwcNodeType<'tSUnknownKeyword'>;

export type LwcTSVoidKeywordType = LwcNodeType<'tSVoidKeyword'>;

export type LwcTupleTypeAnnotationType = LwcNodeType<'tupleTypeAnnotation'> & {
    types: ValueRuleValue<LwcFlowTypeType>[];
};

export type LwcTypeAliasType = LwcNodeType<'typeAlias'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterDeclarationType> | null;
    right: ValueRuleValue<LwcFlowTypeType>;
};

export type LwcTypeCastExpressionType = LwcNodeType<'typeCastExpression'> & {
    expression: ValueRuleValue<LwcExpressionType>;
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType>;
};

export type LwcTypeofTypeAnnotationType = LwcNodeType<'typeofTypeAnnotation'> & {
    argument: ValueRuleValue<LwcFlowTypeType | LwcIdentifierType>;
};

export type LwcUnaryExpressionType = LwcNodeType<'unaryExpression'> & {
    prefix: UnaryExpression['prefix'];
    argument: ValueRuleValue<LwcExpressionType>;
    operator: UnaryExpression['operator'];
};

export type LwcUnionTypeAnnotationType = LwcNodeType<'unionTypeAnnotation'> & {
    types: ValueRuleValue<LwcFlowTypeType>[];
};

export type LwcUpdateExpressionType = LwcNodeType<'updateExpression'> & {
    prefix: UpdateExpression['prefix'];
    argument: ValueRuleValue<LwcIdentifierType | LwcMemberExpressionType>;
    operator: UpdateExpression['operator'];
};

export type LwcVariableDeclarationType = LwcNodeType<'variableDeclaration'> & {
    declare: NonNullable<VariableDeclaration['declare']> | null;
    kind: VariableDeclaration['kind'];
    declarations: ValueRuleValue<LwcVariableDeclaratorType>[];
};

export type LwcVoidPatternType = LwcNodeType<'voidPattern'>;

export type LwcVoidTypeAnnotationType = LwcNodeType<'voidTypeAnnotation'>;

export type LwcWhileStatementType = LwcNodeType<'whileStatement'> & {
    test: ValueRuleValue<LwcExpressionType>;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcWithStatementType = LwcNodeType<'withStatement'> & {
    object: ValueRuleValue<LwcExpressionType>;
    body: ValueRuleValue<LwcStatementType>;
};

export type LwcYieldExpressionType = LwcNodeType<'yieldExpression'> & {
    delegate: YieldExpression['delegate'];
    argument: ValueRuleValue<LwcExpressionType> | null;
};

export type LwcBindExpressionType = LwcNodeType<'bindExpression'> & {
    object: ValueRuleValue<LwcExpressionType> | null;
    callee: ValueRuleValue<LwcExpressionType>;
};

export type LwcDoExpressionType = LwcNodeType<'doExpression'> & {
    body: ValueRuleValue<LwcBlockStatementType>;
    async: DoExpression['async'];
};

export type LwcModuleExpressionType = LwcNodeType<'moduleExpression'> & {
    body: ValueRuleValue<LwcProgramType>;
};

export type LwcTopicReferenceType = LwcNodeType<'topicReference'>;

export type LwcClassImplementsType = LwcNodeType<'classImplements'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterInstantiationType> | null;
};

export type LwcFunctionTypeParamType = LwcNodeType<'functionTypeParam'> & {
    name: ValueRuleValue<LwcIdentifierType> | null;
    typeAnnotation: ValueRuleValue<LwcFlowTypeType>;
    optional: NonNullable<FunctionTypeParam['optional']> | null;
};

export type LwcInterfaceExtendsType = LwcNodeType<'interfaceExtends'> & {
    id: ValueRuleValue<LwcIdentifierType | LwcQualifiedTypeIdentifierType>;
    typeParameters: ValueRuleValue<LwcTypeParameterInstantiationType> | null;
};

export type LwcQualifiedTypeIdentifierType = LwcNodeType<'qualifiedTypeIdentifier'> & {
    id: ValueRuleValue<LwcIdentifierType>;
    qualification: ValueRuleValue<LwcIdentifierType | LwcQualifiedTypeIdentifierType>;
};

export type LwcTypeAnnotationType = LwcNodeType<'typeAnnotation'> & {
    typeAnnotation: ValueRuleValue<LwcFlowTypeType | LwcIdentifierType>;
};

export type LwcTypeParameterType = LwcNodeType<'typeParameter'> & {
    name: TypeParameter['name'];
    bound: ValueRuleValue<LwcTypeAnnotationType> | null;
    default: ValueRuleValue<LwcFlowTypeType> | null;
    variance: ValueRuleValue<LwcVarianceType> | null;
};

export type LwcTypeParameterDeclarationType = LwcNodeType<'typeParameterDeclaration'> & {
    params: ValueRuleValue<LwcTypeParameterType>[];
};

export type LwcTypeParameterInstantiationType = LwcNodeType<'typeParameterInstantiation'> & {
    params: ValueRuleValue<LwcFlowTypeType>[];
};

export type LwcVarianceType = LwcNodeType<'variance'> & {
    kind: Variance['kind'];
};

export type LwcJSXEmptyExpressionType = LwcNodeType<'jSXEmptyExpression'>;

export type LwcJSXIdentifierType = LwcNodeType<'jSXIdentifier'> & {
    name: JSXIdentifier['name'];
};

export type LwcJSXMemberExpressionType = LwcNodeType<'jSXMemberExpression'> & {
    object: ValueRuleValue<LwcJSXMemberExpressionType | LwcJSXIdentifierType>;
    property: ValueRuleValue<LwcJSXIdentifierType>;
};

export type LwcJSXNamespacedNameType = LwcNodeType<'jSXNamespacedName'> & {
    namespace: ValueRuleValue<LwcJSXIdentifierType>;
    name: ValueRuleValue<LwcJSXIdentifierType>;
};

export type LwcJSXSpreadAttributeType = LwcNodeType<'jSXSpreadAttribute'> & {
    argument: ValueRuleValue<LwcExpressionType>;
};

export type LwcPlaceholderType = LwcNodeType<'placeholder'> & {
    name: ValueRuleValue<LwcIdentifierType>;
    expectedNode: Placeholder['expectedNode'];
    typeAnnotation: ValueRuleValue<LwcTypeAnnotationType | LwcTSTypeAnnotationType> | null;
    optional: NonNullable<Placeholder['optional']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
};

export type LwcV8IntrinsicIdentifierType = LwcNodeType<'v8IntrinsicIdentifier'> & {
    name: V8IntrinsicIdentifier['name'];
};

export type LwcExportDefaultSpecifierType = LwcNodeType<'exportDefaultSpecifier'> & {
    exported: ValueRuleValue<LwcIdentifierType>;
};

export type LwcClassBodyType = LwcNodeType<'classBody'> & {
    body: ValueRuleValue<
        | LwcClassMethodType
        | LwcClassPrivateMethodType
        | LwcClassPropertyType
        | LwcClassPrivatePropertyType
        | LwcClassAccessorPropertyType
        | LwcTSDeclareMethodType
        | LwcTSIndexSignatureType
        | LwcStaticBlockType
    >[];
};

export type LwcDirectiveType = LwcNodeType<'directive'> & {
    value: ValueRuleValue<LwcDirectiveLiteralType>;
};

export type LwcDirectiveLiteralType = LwcNodeType<'directiveLiteral'> & {
    value: DirectiveLiteral['value'];
};

export type LwcFileType = LwcNodeType<'file'> & {
    program: ValueRuleValue<LwcProgramType>;
};

export type LwcImportType = LwcNodeType<'import'>;

export type LwcImportAttributeType = LwcNodeType<'importAttribute'> & {
    key: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    value: ValueRuleValue<LwcStringLiteralType>;
};

export type LwcInterpreterDirectiveType = LwcNodeType<'interpreterDirective'> & {
    value: InterpreterDirective['value'];
};

export type LwcSuperType = LwcNodeType<'super'>;

export type LwcSwitchCaseType = LwcNodeType<'switchCase'> & {
    test: ValueRuleValue<LwcExpressionType> | null;
    consequent: ValueRuleValue<LwcStatementType>[];
};

export type LwcTemplateElementType = LwcNodeType<'templateElement'> & {
    value: TemplateElement['value'];
    tail: TemplateElement['tail'];
};

export type LwcVariableDeclaratorType = LwcNodeType<'variableDeclarator'> & {
    id: ValueRuleValue<
        LwcIdentifierType | LwcArrayPatternType | LwcObjectPatternType | LwcVoidPatternType
    >;
    definite: NonNullable<VariableDeclarator['definite']> | null;
    init: ValueRuleValue<LwcExpressionType> | null;
};

export type LwcTSDeclareMethodType = LwcNodeType<'tSDeclareMethod'> & {
    params: ValueRuleValue<LwcFunctionParameterType | LwcTSParameterPropertyType>[];
    generator: TSDeclareMethod['generator'];
    async: TSDeclareMethod['async'];
    abstract: NonNullable<TSDeclareMethod['abstract']> | null;
    accessibility: NonNullable<TSDeclareMethod['accessibility']> | null;
    static: TSDeclareMethod['static'];
    override: NonNullable<TSDeclareMethod['override']> | null;
    computed: TSDeclareMethod['computed'];
    optional: NonNullable<TSDeclareMethod['optional']> | null;
    key: ValueRuleValue<LwcExpressionType | LwcPrivateNameType>;
    kind: TSDeclareMethod['kind'];
    access: NonNullable<TSDeclareMethod['access']> | null;
    returnType: ValueRuleValue<LwcTSTypeAnnotationType> | null;
    typeParameters: ValueRuleValue<LwcTSTypeParameterDeclarationType> | null;
};

export type LwcTSEnumBodyType = LwcNodeType<'tSEnumBody'> & {
    members: ValueRuleValue<LwcTSEnumMemberType>[];
};

export type LwcTSEnumMemberType = LwcNodeType<'tSEnumMember'> & {
    id: ValueRuleValue<LwcIdentifierType | LwcStringLiteralType>;
    initializer: ValueRuleValue<LwcExpressionType> | null;
};

export type LwcTSExternalModuleReferenceType = LwcNodeType<'tSExternalModuleReference'> & {
    expression: ValueRuleValue<LwcStringLiteralType>;
};

export type LwcTSInterfaceBodyType = LwcNodeType<'tSInterfaceBody'> & {
    body: ValueRuleValue<LwcTSTypeElementType>[];
};

export type LwcTSParameterPropertyType = LwcNodeType<'tSParameterProperty'> & {
    accessibility: NonNullable<TSParameterProperty['accessibility']> | null;
    readonly: NonNullable<TSParameterProperty['readonly']> | null;
    parameter: ValueRuleValue<LwcIdentifierType | LwcAssignmentPatternType>;
    override: NonNullable<TSParameterProperty['override']> | null;
    decorators: ValueRuleValue<LwcDecoratorType>[] | null;
};

export type LwcTSTypeAnnotationType = LwcNodeType<'tSTypeAnnotation'> & {
    typeAnnotation: ValueRuleValue<LwcTSTypeType>;
};

export type LwcTSTypeParameterType = LwcNodeType<'tSTypeParameter'> & {
    name: ValueRuleValue<LwcIdentifierType>;
    in: NonNullable<TSTypeParameter['in']> | null;
    out: NonNullable<TSTypeParameter['out']> | null;
    const: NonNullable<TSTypeParameter['const']> | null;
    constraint: ValueRuleValue<LwcTSTypeType> | null;
    default: ValueRuleValue<LwcTSTypeType> | null;
};

export type LwcTSTypeParameterDeclarationType = LwcNodeType<'tSTypeParameterDeclaration'> & {
    params: ValueRuleValue<LwcTSTypeParameterType>[];
};

export type LwcTSTypeParameterInstantiationType = LwcNodeType<'tSTypeParameterInstantiation'> & {
    params: ValueRuleValue<LwcTSTypeType>[];
};

// alias (Babel の FLIPPED_ALIAS_KEYS) ごとの union
export type LwcStandardizedType =
    | LwcArrayExpressionType
    | LwcAssignmentExpressionType
    | LwcBinaryExpressionType
    | LwcInterpreterDirectiveType
    | LwcDirectiveType
    | LwcDirectiveLiteralType
    | LwcBlockStatementType
    | LwcBreakStatementType
    | LwcCallExpressionType
    | LwcCatchClauseType
    | LwcConditionalExpressionType
    | LwcContinueStatementType
    | LwcDebuggerStatementType
    | LwcDoWhileStatementType
    | LwcEmptyStatementType
    | LwcExpressionStatementType
    | LwcFileType
    | LwcForInStatementType
    | LwcForStatementType
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcIdentifierType
    | LwcIfStatementType
    | LwcLabeledStatementType
    | LwcStringLiteralType
    | LwcNumericLiteralType
    | LwcNullLiteralType
    | LwcBooleanLiteralType
    | LwcRegExpLiteralType
    | LwcLogicalExpressionType
    | LwcMemberExpressionType
    | LwcNewExpressionType
    | LwcProgramType
    | LwcObjectExpressionType
    | LwcObjectMethodType
    | LwcObjectPropertyType
    | LwcRestElementType
    | LwcReturnStatementType
    | LwcSequenceExpressionType
    | LwcParenthesizedExpressionType
    | LwcSwitchCaseType
    | LwcSwitchStatementType
    | LwcThisExpressionType
    | LwcThrowStatementType
    | LwcTryStatementType
    | LwcUnaryExpressionType
    | LwcUpdateExpressionType
    | LwcVariableDeclarationType
    | LwcVariableDeclaratorType
    | LwcWhileStatementType
    | LwcWithStatementType
    | LwcAssignmentPatternType
    | LwcArrayPatternType
    | LwcArrowFunctionExpressionType
    | LwcClassBodyType
    | LwcClassExpressionType
    | LwcClassDeclarationType
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcExportSpecifierType
    | LwcForOfStatementType
    | LwcImportDeclarationType
    | LwcImportDefaultSpecifierType
    | LwcImportNamespaceSpecifierType
    | LwcImportSpecifierType
    | LwcMetaPropertyType
    | LwcClassMethodType
    | LwcObjectPatternType
    | LwcSpreadElementType
    | LwcSuperType
    | LwcTaggedTemplateExpressionType
    | LwcTemplateElementType
    | LwcTemplateLiteralType
    | LwcYieldExpressionType
    | LwcAwaitExpressionType
    | LwcImportExpressionType
    | LwcImportType
    | LwcBigIntLiteralType
    | LwcExportNamespaceSpecifierType
    | LwcOptionalMemberExpressionType
    | LwcOptionalCallExpressionType
    | LwcClassPropertyType
    | LwcClassPrivatePropertyType
    | LwcClassPrivateMethodType
    | LwcPrivateNameType
    | LwcStaticBlockType
    | LwcImportAttributeType;

export type LwcExpressionType =
    | LwcArrayExpressionType
    | LwcAssignmentExpressionType
    | LwcBinaryExpressionType
    | LwcCallExpressionType
    | LwcConditionalExpressionType
    | LwcFunctionExpressionType
    | LwcIdentifierType
    | LwcStringLiteralType
    | LwcNumericLiteralType
    | LwcNullLiteralType
    | LwcBooleanLiteralType
    | LwcRegExpLiteralType
    | LwcLogicalExpressionType
    | LwcMemberExpressionType
    | LwcNewExpressionType
    | LwcObjectExpressionType
    | LwcSequenceExpressionType
    | LwcParenthesizedExpressionType
    | LwcThisExpressionType
    | LwcUnaryExpressionType
    | LwcUpdateExpressionType
    | LwcArrowFunctionExpressionType
    | LwcClassExpressionType
    | LwcMetaPropertyType
    | LwcTaggedTemplateExpressionType
    | LwcTemplateLiteralType
    | LwcYieldExpressionType
    | LwcAwaitExpressionType
    | LwcImportExpressionType
    | LwcBigIntLiteralType
    | LwcOptionalMemberExpressionType
    | LwcOptionalCallExpressionType
    | LwcTypeCastExpressionType
    | LwcJSXElementType
    | LwcJSXFragmentType
    | LwcBindExpressionType
    | LwcDoExpressionType
    | LwcModuleExpressionType
    | LwcTopicReferenceType
    | LwcTSInstantiationExpressionType
    | LwcTSAsExpressionType
    | LwcTSSatisfiesExpressionType
    | LwcTSTypeAssertionType
    | LwcTSNonNullExpressionType;

export type LwcBinaryType = LwcBinaryExpressionType | LwcLogicalExpressionType;

export type LwcScopableType =
    | LwcBlockStatementType
    | LwcCatchClauseType
    | LwcDoWhileStatementType
    | LwcForInStatementType
    | LwcForStatementType
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcProgramType
    | LwcObjectMethodType
    | LwcSwitchStatementType
    | LwcWhileStatementType
    | LwcArrowFunctionExpressionType
    | LwcClassExpressionType
    | LwcClassDeclarationType
    | LwcForOfStatementType
    | LwcClassMethodType
    | LwcClassPrivateMethodType
    | LwcStaticBlockType
    | LwcTSModuleBlockType;

export type LwcBlockParentType =
    | LwcBlockStatementType
    | LwcCatchClauseType
    | LwcDoWhileStatementType
    | LwcForInStatementType
    | LwcForStatementType
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcProgramType
    | LwcObjectMethodType
    | LwcSwitchStatementType
    | LwcWhileStatementType
    | LwcArrowFunctionExpressionType
    | LwcForOfStatementType
    | LwcClassMethodType
    | LwcClassPrivateMethodType
    | LwcStaticBlockType
    | LwcTSModuleBlockType;

export type LwcBlockType = LwcBlockStatementType | LwcProgramType | LwcTSModuleBlockType;

export type LwcStatementType =
    | LwcBlockStatementType
    | LwcBreakStatementType
    | LwcContinueStatementType
    | LwcDebuggerStatementType
    | LwcDoWhileStatementType
    | LwcEmptyStatementType
    | LwcExpressionStatementType
    | LwcForInStatementType
    | LwcForStatementType
    | LwcFunctionDeclarationType
    | LwcIfStatementType
    | LwcLabeledStatementType
    | LwcReturnStatementType
    | LwcSwitchStatementType
    | LwcThrowStatementType
    | LwcTryStatementType
    | LwcVariableDeclarationType
    | LwcWhileStatementType
    | LwcWithStatementType
    | LwcClassDeclarationType
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcForOfStatementType
    | LwcImportDeclarationType
    | LwcDeclareClassType
    | LwcDeclareFunctionType
    | LwcDeclareInterfaceType
    | LwcDeclareModuleType
    | LwcDeclareModuleExportsType
    | LwcDeclareTypeAliasType
    | LwcDeclareOpaqueTypeType
    | LwcDeclareVariableType
    | LwcDeclareExportDeclarationType
    | LwcDeclareExportAllDeclarationType
    | LwcInterfaceDeclarationType
    | LwcOpaqueTypeType
    | LwcTypeAliasType
    | LwcEnumDeclarationType
    | LwcTSDeclareFunctionType
    | LwcTSInterfaceDeclarationType
    | LwcTSTypeAliasDeclarationType
    | LwcTSEnumDeclarationType
    | LwcTSModuleDeclarationType
    | LwcTSImportEqualsDeclarationType
    | LwcTSExportAssignmentType
    | LwcTSNamespaceExportDeclarationType;

export type LwcTerminatorlessType =
    | LwcBreakStatementType
    | LwcContinueStatementType
    | LwcReturnStatementType
    | LwcThrowStatementType
    | LwcYieldExpressionType
    | LwcAwaitExpressionType;

export type LwcCompletionStatementType =
    | LwcBreakStatementType
    | LwcContinueStatementType
    | LwcReturnStatementType
    | LwcThrowStatementType;

export type LwcConditionalType = LwcConditionalExpressionType | LwcIfStatementType;

export type LwcLoopType =
    | LwcDoWhileStatementType
    | LwcForInStatementType
    | LwcForStatementType
    | LwcWhileStatementType
    | LwcForOfStatementType;

export type LwcWhileType = LwcDoWhileStatementType | LwcWhileStatementType;

export type LwcExpressionWrapperType =
    LwcExpressionStatementType | LwcParenthesizedExpressionType | LwcTypeCastExpressionType;

export type LwcForType = LwcForInStatementType | LwcForStatementType | LwcForOfStatementType;

export type LwcForXStatementType = LwcForInStatementType | LwcForOfStatementType;

export type LwcFunctionType =
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcObjectMethodType
    | LwcArrowFunctionExpressionType
    | LwcClassMethodType
    | LwcClassPrivateMethodType;

export type LwcFunctionParentType =
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcObjectMethodType
    | LwcArrowFunctionExpressionType
    | LwcClassMethodType
    | LwcClassPrivateMethodType
    | LwcStaticBlockType
    | LwcTSModuleBlockType;

export type LwcPureishType =
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcStringLiteralType
    | LwcNumericLiteralType
    | LwcNullLiteralType
    | LwcBooleanLiteralType
    | LwcRegExpLiteralType
    | LwcArrowFunctionExpressionType
    | LwcBigIntLiteralType;

export type LwcDeclarationType =
    | LwcFunctionDeclarationType
    | LwcVariableDeclarationType
    | LwcClassDeclarationType
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcImportDeclarationType
    | LwcDeclareClassType
    | LwcDeclareFunctionType
    | LwcDeclareInterfaceType
    | LwcDeclareModuleType
    | LwcDeclareModuleExportsType
    | LwcDeclareTypeAliasType
    | LwcDeclareOpaqueTypeType
    | LwcDeclareVariableType
    | LwcDeclareExportDeclarationType
    | LwcDeclareExportAllDeclarationType
    | LwcInterfaceDeclarationType
    | LwcOpaqueTypeType
    | LwcTypeAliasType
    | LwcEnumDeclarationType
    | LwcTSDeclareFunctionType
    | LwcTSInterfaceDeclarationType
    | LwcTSTypeAliasDeclarationType
    | LwcTSEnumDeclarationType
    | LwcTSModuleDeclarationType
    | LwcTSImportEqualsDeclarationType;

export type LwcFunctionParameterType =
    | LwcIdentifierType
    | LwcRestElementType
    | LwcAssignmentPatternType
    | LwcArrayPatternType
    | LwcObjectPatternType
    | LwcVoidPatternType;

export type LwcPatternLikeType =
    | LwcIdentifierType
    | LwcMemberExpressionType
    | LwcRestElementType
    | LwcAssignmentPatternType
    | LwcArrayPatternType
    | LwcObjectPatternType
    | LwcVoidPatternType
    | LwcTSAsExpressionType
    | LwcTSSatisfiesExpressionType
    | LwcTSTypeAssertionType
    | LwcTSNonNullExpressionType;

export type LwcLValType =
    | LwcIdentifierType
    | LwcMemberExpressionType
    | LwcArrayPatternType
    | LwcObjectPatternType
    | LwcTSAsExpressionType
    | LwcTSSatisfiesExpressionType
    | LwcTSTypeAssertionType
    | LwcTSNonNullExpressionType;

export type LwcTSEntityNameType =
    LwcIdentifierType | LwcThisExpressionType | LwcTSQualifiedNameType;

export type LwcLiteralType =
    | LwcStringLiteralType
    | LwcNumericLiteralType
    | LwcNullLiteralType
    | LwcBooleanLiteralType
    | LwcRegExpLiteralType
    | LwcTemplateLiteralType
    | LwcBigIntLiteralType;

export type LwcImmutableType =
    | LwcStringLiteralType
    | LwcNumericLiteralType
    | LwcNullLiteralType
    | LwcBooleanLiteralType
    | LwcBigIntLiteralType
    | LwcJSXAttributeType
    | LwcJSXClosingElementType
    | LwcJSXElementType
    | LwcJSXExpressionContainerType
    | LwcJSXSpreadChildType
    | LwcJSXOpeningElementType
    | LwcJSXTextType
    | LwcJSXFragmentType
    | LwcJSXOpeningFragmentType
    | LwcJSXClosingFragmentType;

export type LwcUserWhitespacableType =
    | LwcObjectMethodType
    | LwcObjectPropertyType
    | LwcObjectTypeInternalSlotType
    | LwcObjectTypeCallPropertyType
    | LwcObjectTypeIndexerType
    | LwcObjectTypePropertyType
    | LwcObjectTypeSpreadPropertyType;

export type LwcMethodType = LwcObjectMethodType | LwcClassMethodType | LwcClassPrivateMethodType;

export type LwcObjectMemberType = LwcObjectMethodType | LwcObjectPropertyType;

export type LwcPropertyType =
    | LwcObjectPropertyType
    | LwcClassPropertyType
    | LwcClassPrivatePropertyType
    | LwcClassAccessorPropertyType;

export type LwcUnaryLikeType = LwcUnaryExpressionType | LwcSpreadElementType;

export type LwcPatternType =
    LwcAssignmentPatternType | LwcArrayPatternType | LwcObjectPatternType | LwcVoidPatternType;

export type LwcClassType = LwcClassExpressionType | LwcClassDeclarationType;

export type LwcImportOrExportDeclarationType =
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcImportDeclarationType;

export type LwcExportDeclarationType =
    LwcExportAllDeclarationType | LwcExportDefaultDeclarationType | LwcExportNamedDeclarationType;

export type LwcModuleSpecifierType =
    | LwcExportSpecifierType
    | LwcImportDefaultSpecifierType
    | LwcImportNamespaceSpecifierType
    | LwcImportSpecifierType
    | LwcExportNamespaceSpecifierType
    | LwcExportDefaultSpecifierType;

export type LwcPrivateType =
    LwcClassPrivatePropertyType | LwcClassPrivateMethodType | LwcPrivateNameType;

export type LwcFlowType =
    | LwcAnyTypeAnnotationType
    | LwcArrayTypeAnnotationType
    | LwcBooleanTypeAnnotationType
    | LwcBooleanLiteralTypeAnnotationType
    | LwcNullLiteralTypeAnnotationType
    | LwcClassImplementsType
    | LwcDeclareClassType
    | LwcDeclareFunctionType
    | LwcDeclareInterfaceType
    | LwcDeclareModuleType
    | LwcDeclareModuleExportsType
    | LwcDeclareTypeAliasType
    | LwcDeclareOpaqueTypeType
    | LwcDeclareVariableType
    | LwcDeclareExportDeclarationType
    | LwcDeclareExportAllDeclarationType
    | LwcDeclaredPredicateType
    | LwcExistsTypeAnnotationType
    | LwcFunctionTypeAnnotationType
    | LwcFunctionTypeParamType
    | LwcGenericTypeAnnotationType
    | LwcInferredPredicateType
    | LwcInterfaceExtendsType
    | LwcInterfaceDeclarationType
    | LwcInterfaceTypeAnnotationType
    | LwcIntersectionTypeAnnotationType
    | LwcMixedTypeAnnotationType
    | LwcEmptyTypeAnnotationType
    | LwcNullableTypeAnnotationType
    | LwcNumberLiteralTypeAnnotationType
    | LwcBigIntLiteralTypeAnnotationType
    | LwcNumberTypeAnnotationType
    | LwcObjectTypeAnnotationType
    | LwcObjectTypeInternalSlotType
    | LwcObjectTypeCallPropertyType
    | LwcObjectTypeIndexerType
    | LwcObjectTypePropertyType
    | LwcObjectTypeSpreadPropertyType
    | LwcOpaqueTypeType
    | LwcQualifiedTypeIdentifierType
    | LwcStringLiteralTypeAnnotationType
    | LwcStringTypeAnnotationType
    | LwcSymbolTypeAnnotationType
    | LwcThisTypeAnnotationType
    | LwcTupleTypeAnnotationType
    | LwcTypeofTypeAnnotationType
    | LwcTypeAliasType
    | LwcTypeAnnotationType
    | LwcTypeCastExpressionType
    | LwcTypeParameterType
    | LwcTypeParameterDeclarationType
    | LwcTypeParameterInstantiationType
    | LwcUnionTypeAnnotationType
    | LwcVarianceType
    | LwcVoidTypeAnnotationType
    | LwcEnumDeclarationType
    | LwcEnumBooleanBodyType
    | LwcEnumNumberBodyType
    | LwcEnumStringBodyType
    | LwcEnumSymbolBodyType
    | LwcEnumBooleanMemberType
    | LwcEnumNumberMemberType
    | LwcEnumStringMemberType
    | LwcEnumDefaultedMemberType
    | LwcIndexedAccessTypeType
    | LwcOptionalIndexedAccessTypeType;

export type LwcFlowTypeType =
    | LwcAnyTypeAnnotationType
    | LwcArrayTypeAnnotationType
    | LwcBooleanTypeAnnotationType
    | LwcBooleanLiteralTypeAnnotationType
    | LwcNullLiteralTypeAnnotationType
    | LwcExistsTypeAnnotationType
    | LwcFunctionTypeAnnotationType
    | LwcGenericTypeAnnotationType
    | LwcInterfaceTypeAnnotationType
    | LwcIntersectionTypeAnnotationType
    | LwcMixedTypeAnnotationType
    | LwcEmptyTypeAnnotationType
    | LwcNullableTypeAnnotationType
    | LwcNumberLiteralTypeAnnotationType
    | LwcBigIntLiteralTypeAnnotationType
    | LwcNumberTypeAnnotationType
    | LwcObjectTypeAnnotationType
    | LwcStringLiteralTypeAnnotationType
    | LwcStringTypeAnnotationType
    | LwcSymbolTypeAnnotationType
    | LwcThisTypeAnnotationType
    | LwcTupleTypeAnnotationType
    | LwcTypeofTypeAnnotationType
    | LwcUnionTypeAnnotationType
    | LwcVoidTypeAnnotationType
    | LwcIndexedAccessTypeType
    | LwcOptionalIndexedAccessTypeType;

export type LwcFlowBaseAnnotationType =
    | LwcAnyTypeAnnotationType
    | LwcBooleanTypeAnnotationType
    | LwcNullLiteralTypeAnnotationType
    | LwcMixedTypeAnnotationType
    | LwcEmptyTypeAnnotationType
    | LwcNumberTypeAnnotationType
    | LwcStringTypeAnnotationType
    | LwcSymbolTypeAnnotationType
    | LwcThisTypeAnnotationType
    | LwcVoidTypeAnnotationType;

export type LwcFlowDeclarationType =
    | LwcDeclareClassType
    | LwcDeclareFunctionType
    | LwcDeclareInterfaceType
    | LwcDeclareModuleType
    | LwcDeclareModuleExportsType
    | LwcDeclareTypeAliasType
    | LwcDeclareOpaqueTypeType
    | LwcDeclareVariableType
    | LwcDeclareExportDeclarationType
    | LwcDeclareExportAllDeclarationType
    | LwcInterfaceDeclarationType
    | LwcOpaqueTypeType
    | LwcTypeAliasType;

export type LwcFlowPredicateType = LwcDeclaredPredicateType | LwcInferredPredicateType;

export type LwcEnumBodyType =
    LwcEnumBooleanBodyType | LwcEnumNumberBodyType | LwcEnumStringBodyType | LwcEnumSymbolBodyType;

export type LwcEnumMemberType =
    | LwcEnumBooleanMemberType
    | LwcEnumNumberMemberType
    | LwcEnumStringMemberType
    | LwcEnumDefaultedMemberType;

export type LwcJSXType =
    | LwcJSXAttributeType
    | LwcJSXClosingElementType
    | LwcJSXElementType
    | LwcJSXEmptyExpressionType
    | LwcJSXExpressionContainerType
    | LwcJSXSpreadChildType
    | LwcJSXIdentifierType
    | LwcJSXMemberExpressionType
    | LwcJSXNamespacedNameType
    | LwcJSXOpeningElementType
    | LwcJSXSpreadAttributeType
    | LwcJSXTextType
    | LwcJSXFragmentType
    | LwcJSXOpeningFragmentType
    | LwcJSXClosingFragmentType;

export type LwcMiscellaneousType = LwcPlaceholderType | LwcV8IntrinsicIdentifierType;

export type LwcAccessorType = LwcClassAccessorPropertyType;

export type LwcTypeScriptType =
    | LwcTSParameterPropertyType
    | LwcTSDeclareFunctionType
    | LwcTSDeclareMethodType
    | LwcTSQualifiedNameType
    | LwcTSCallSignatureDeclarationType
    | LwcTSConstructSignatureDeclarationType
    | LwcTSPropertySignatureType
    | LwcTSMethodSignatureType
    | LwcTSIndexSignatureType
    | LwcTSAnyKeywordType
    | LwcTSBooleanKeywordType
    | LwcTSBigIntKeywordType
    | LwcTSIntrinsicKeywordType
    | LwcTSNeverKeywordType
    | LwcTSNullKeywordType
    | LwcTSNumberKeywordType
    | LwcTSObjectKeywordType
    | LwcTSStringKeywordType
    | LwcTSSymbolKeywordType
    | LwcTSUndefinedKeywordType
    | LwcTSUnknownKeywordType
    | LwcTSVoidKeywordType
    | LwcTSThisTypeType
    | LwcTSFunctionTypeType
    | LwcTSConstructorTypeType
    | LwcTSTypeReferenceType
    | LwcTSTypePredicateType
    | LwcTSTypeQueryType
    | LwcTSTypeLiteralType
    | LwcTSArrayTypeType
    | LwcTSTupleTypeType
    | LwcTSOptionalTypeType
    | LwcTSRestTypeType
    | LwcTSNamedTupleMemberType
    | LwcTSUnionTypeType
    | LwcTSIntersectionTypeType
    | LwcTSConditionalTypeType
    | LwcTSInferTypeType
    | LwcTSParenthesizedTypeType
    | LwcTSTypeOperatorType
    | LwcTSIndexedAccessTypeType
    | LwcTSMappedTypeType
    | LwcTSTemplateLiteralTypeType
    | LwcTSLiteralTypeType
    | LwcTSClassImplementsType
    | LwcTSInterfaceHeritageType
    | LwcTSInterfaceDeclarationType
    | LwcTSInterfaceBodyType
    | LwcTSTypeAliasDeclarationType
    | LwcTSInstantiationExpressionType
    | LwcTSAsExpressionType
    | LwcTSSatisfiesExpressionType
    | LwcTSTypeAssertionType
    | LwcTSEnumBodyType
    | LwcTSEnumDeclarationType
    | LwcTSEnumMemberType
    | LwcTSModuleDeclarationType
    | LwcTSModuleBlockType
    | LwcTSImportTypeType
    | LwcTSImportEqualsDeclarationType
    | LwcTSExternalModuleReferenceType
    | LwcTSNonNullExpressionType
    | LwcTSExportAssignmentType
    | LwcTSNamespaceExportDeclarationType
    | LwcTSTypeAnnotationType
    | LwcTSTypeParameterInstantiationType
    | LwcTSTypeParameterDeclarationType
    | LwcTSTypeParameterType;

export type LwcTSTypeElementType =
    | LwcTSCallSignatureDeclarationType
    | LwcTSConstructSignatureDeclarationType
    | LwcTSPropertySignatureType
    | LwcTSMethodSignatureType
    | LwcTSIndexSignatureType;

export type LwcTSTypeType =
    | LwcTSAnyKeywordType
    | LwcTSBooleanKeywordType
    | LwcTSBigIntKeywordType
    | LwcTSIntrinsicKeywordType
    | LwcTSNeverKeywordType
    | LwcTSNullKeywordType
    | LwcTSNumberKeywordType
    | LwcTSObjectKeywordType
    | LwcTSStringKeywordType
    | LwcTSSymbolKeywordType
    | LwcTSUndefinedKeywordType
    | LwcTSUnknownKeywordType
    | LwcTSVoidKeywordType
    | LwcTSThisTypeType
    | LwcTSFunctionTypeType
    | LwcTSConstructorTypeType
    | LwcTSTypeReferenceType
    | LwcTSTypePredicateType
    | LwcTSTypeQueryType
    | LwcTSTypeLiteralType
    | LwcTSArrayTypeType
    | LwcTSTupleTypeType
    | LwcTSOptionalTypeType
    | LwcTSRestTypeType
    | LwcTSNamedTupleMemberType
    | LwcTSUnionTypeType
    | LwcTSIntersectionTypeType
    | LwcTSConditionalTypeType
    | LwcTSInferTypeType
    | LwcTSParenthesizedTypeType
    | LwcTSTypeOperatorType
    | LwcTSIndexedAccessTypeType
    | LwcTSMappedTypeType
    | LwcTSTemplateLiteralTypeType
    | LwcTSLiteralTypeType
    | LwcTSClassImplementsType
    | LwcTSInterfaceHeritageType
    | LwcTSImportTypeType;

export type LwcTSBaseTypeType =
    | LwcTSAnyKeywordType
    | LwcTSBooleanKeywordType
    | LwcTSBigIntKeywordType
    | LwcTSIntrinsicKeywordType
    | LwcTSNeverKeywordType
    | LwcTSNullKeywordType
    | LwcTSNumberKeywordType
    | LwcTSObjectKeywordType
    | LwcTSStringKeywordType
    | LwcTSSymbolKeywordType
    | LwcTSUndefinedKeywordType
    | LwcTSUnknownKeywordType
    | LwcTSVoidKeywordType
    | LwcTSThisTypeType
    | LwcTSTemplateLiteralTypeType
    | LwcTSLiteralTypeType;

export type LwcModuleDeclarationType =
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcImportDeclarationType;

/** すべてのノード */
export type LwcAnyNodeType =
    | LwcAnyTypeAnnotationType
    | LwcArgumentPlaceholderType
    | LwcArrayExpressionType
    | LwcArrayPatternType
    | LwcArrayTypeAnnotationType
    | LwcArrowFunctionExpressionType
    | LwcAssignmentExpressionType
    | LwcAssignmentPatternType
    | LwcAwaitExpressionType
    | LwcBigIntLiteralType
    | LwcBigIntLiteralTypeAnnotationType
    | LwcBinaryExpressionType
    | LwcBlockStatementType
    | LwcBooleanLiteralType
    | LwcBooleanLiteralTypeAnnotationType
    | LwcBooleanTypeAnnotationType
    | LwcBreakStatementType
    | LwcCallExpressionType
    | LwcCatchClauseType
    | LwcClassAccessorPropertyType
    | LwcClassDeclarationType
    | LwcClassExpressionType
    | LwcClassMethodType
    | LwcClassPrivateMethodType
    | LwcClassPrivatePropertyType
    | LwcClassPropertyType
    | LwcConditionalExpressionType
    | LwcContinueStatementType
    | LwcDebuggerStatementType
    | LwcDeclareClassType
    | LwcDeclaredPredicateType
    | LwcDeclareExportAllDeclarationType
    | LwcDeclareExportDeclarationType
    | LwcDeclareFunctionType
    | LwcDeclareInterfaceType
    | LwcDeclareModuleType
    | LwcDeclareModuleExportsType
    | LwcDeclareOpaqueTypeType
    | LwcDeclareTypeAliasType
    | LwcDeclareVariableType
    | LwcDecoratorType
    | LwcDoWhileStatementType
    | LwcEmptyStatementType
    | LwcEmptyTypeAnnotationType
    | LwcEnumBooleanBodyType
    | LwcEnumBooleanMemberType
    | LwcEnumDeclarationType
    | LwcEnumDefaultedMemberType
    | LwcEnumNumberBodyType
    | LwcEnumNumberMemberType
    | LwcEnumStringBodyType
    | LwcEnumStringMemberType
    | LwcEnumSymbolBodyType
    | LwcExistsTypeAnnotationType
    | LwcExportAllDeclarationType
    | LwcExportDefaultDeclarationType
    | LwcExportNamedDeclarationType
    | LwcExportNamespaceSpecifierType
    | LwcExportSpecifierType
    | LwcExpressionStatementType
    | LwcForInStatementType
    | LwcForOfStatementType
    | LwcForStatementType
    | LwcFunctionDeclarationType
    | LwcFunctionExpressionType
    | LwcFunctionTypeAnnotationType
    | LwcGenericTypeAnnotationType
    | LwcIdentifierType
    | LwcIfStatementType
    | LwcImportDeclarationType
    | LwcImportDefaultSpecifierType
    | LwcImportExpressionType
    | LwcImportNamespaceSpecifierType
    | LwcImportSpecifierType
    | LwcIndexedAccessTypeType
    | LwcInferredPredicateType
    | LwcInterfaceDeclarationType
    | LwcInterfaceTypeAnnotationType
    | LwcIntersectionTypeAnnotationType
    | LwcJSXAttributeType
    | LwcJSXClosingElementType
    | LwcJSXClosingFragmentType
    | LwcJSXElementType
    | LwcJSXExpressionContainerType
    | LwcJSXFragmentType
    | LwcJSXOpeningElementType
    | LwcJSXOpeningFragmentType
    | LwcJSXSpreadChildType
    | LwcJSXTextType
    | LwcLabeledStatementType
    | LwcLogicalExpressionType
    | LwcMemberExpressionType
    | LwcMetaPropertyType
    | LwcMixedTypeAnnotationType
    | LwcNewExpressionType
    | LwcNullableTypeAnnotationType
    | LwcNullLiteralType
    | LwcNullLiteralTypeAnnotationType
    | LwcNumberLiteralType
    | LwcNumberLiteralTypeAnnotationType
    | LwcNumberTypeAnnotationType
    | LwcNumericLiteralType
    | LwcObjectExpressionType
    | LwcObjectMethodType
    | LwcObjectPatternType
    | LwcObjectPropertyType
    | LwcObjectTypeAnnotationType
    | LwcObjectTypeCallPropertyType
    | LwcObjectTypeIndexerType
    | LwcObjectTypeInternalSlotType
    | LwcObjectTypePropertyType
    | LwcObjectTypeSpreadPropertyType
    | LwcOpaqueTypeType
    | LwcOptionalCallExpressionType
    | LwcOptionalIndexedAccessTypeType
    | LwcOptionalMemberExpressionType
    | LwcParenthesizedExpressionType
    | LwcPrivateNameType
    | LwcProgramType
    | LwcRegexLiteralType
    | LwcRegExpLiteralType
    | LwcRestElementType
    | LwcRestPropertyType
    | LwcReturnStatementType
    | LwcSequenceExpressionType
    | LwcSpreadElementType
    | LwcSpreadPropertyType
    | LwcStaticBlockType
    | LwcStringLiteralType
    | LwcStringLiteralTypeAnnotationType
    | LwcStringTypeAnnotationType
    | LwcSwitchStatementType
    | LwcSymbolTypeAnnotationType
    | LwcTaggedTemplateExpressionType
    | LwcTemplateLiteralType
    | LwcThisExpressionType
    | LwcThisTypeAnnotationType
    | LwcThrowStatementType
    | LwcTryStatementType
    | LwcTSAnyKeywordType
    | LwcTSArrayTypeType
    | LwcTSAsExpressionType
    | LwcTSBigIntKeywordType
    | LwcTSBooleanKeywordType
    | LwcTSCallSignatureDeclarationType
    | LwcTSClassImplementsType
    | LwcTSConditionalTypeType
    | LwcTSConstructorTypeType
    | LwcTSConstructSignatureDeclarationType
    | LwcTSDeclareFunctionType
    | LwcTSEnumDeclarationType
    | LwcTSExportAssignmentType
    | LwcTSFunctionTypeType
    | LwcTSImportEqualsDeclarationType
    | LwcTSImportTypeType
    | LwcTSIndexedAccessTypeType
    | LwcTSIndexSignatureType
    | LwcTSInferTypeType
    | LwcTSInstantiationExpressionType
    | LwcTSInterfaceDeclarationType
    | LwcTSInterfaceHeritageType
    | LwcTSIntersectionTypeType
    | LwcTSIntrinsicKeywordType
    | LwcTSLiteralTypeType
    | LwcTSMappedTypeType
    | LwcTSMethodSignatureType
    | LwcTSModuleBlockType
    | LwcTSModuleDeclarationType
    | LwcTSNamedTupleMemberType
    | LwcTSNamespaceExportDeclarationType
    | LwcTSNeverKeywordType
    | LwcTSNonNullExpressionType
    | LwcTSNullKeywordType
    | LwcTSNumberKeywordType
    | LwcTSObjectKeywordType
    | LwcTSOptionalTypeType
    | LwcTSParenthesizedTypeType
    | LwcTSPropertySignatureType
    | LwcTSQualifiedNameType
    | LwcTSRestTypeType
    | LwcTSSatisfiesExpressionType
    | LwcTSStringKeywordType
    | LwcTSSymbolKeywordType
    | LwcTSTemplateLiteralTypeType
    | LwcTSThisTypeType
    | LwcTSTupleTypeType
    | LwcTSTypeAliasDeclarationType
    | LwcTSTypeAssertionType
    | LwcTSTypeLiteralType
    | LwcTSTypeOperatorType
    | LwcTSTypePredicateType
    | LwcTSTypeQueryType
    | LwcTSTypeReferenceType
    | LwcTSUndefinedKeywordType
    | LwcTSUnionTypeType
    | LwcTSUnknownKeywordType
    | LwcTSVoidKeywordType
    | LwcTupleTypeAnnotationType
    | LwcTypeAliasType
    | LwcTypeCastExpressionType
    | LwcTypeofTypeAnnotationType
    | LwcUnaryExpressionType
    | LwcUnionTypeAnnotationType
    | LwcUpdateExpressionType
    | LwcVariableDeclarationType
    | LwcVoidPatternType
    | LwcVoidTypeAnnotationType
    | LwcWhileStatementType
    | LwcWithStatementType
    | LwcYieldExpressionType
    | LwcBindExpressionType
    | LwcDoExpressionType
    | LwcModuleExpressionType
    | LwcTopicReferenceType
    | LwcClassImplementsType
    | LwcFunctionTypeParamType
    | LwcInterfaceExtendsType
    | LwcQualifiedTypeIdentifierType
    | LwcTypeAnnotationType
    | LwcTypeParameterType
    | LwcTypeParameterDeclarationType
    | LwcTypeParameterInstantiationType
    | LwcVarianceType
    | LwcJSXEmptyExpressionType
    | LwcJSXIdentifierType
    | LwcJSXMemberExpressionType
    | LwcJSXNamespacedNameType
    | LwcJSXSpreadAttributeType
    | LwcPlaceholderType
    | LwcV8IntrinsicIdentifierType
    | LwcExportDefaultSpecifierType
    | LwcClassBodyType
    | LwcDirectiveType
    | LwcDirectiveLiteralType
    | LwcFileType
    | LwcImportType
    | LwcImportAttributeType
    | LwcInterpreterDirectiveType
    | LwcSuperType
    | LwcSwitchCaseType
    | LwcTemplateElementType
    | LwcVariableDeclaratorType
    | LwcTSDeclareMethodType
    | LwcTSEnumBodyType
    | LwcTSEnumMemberType
    | LwcTSExternalModuleReferenceType
    | LwcTSInterfaceBodyType
    | LwcTSParameterPropertyType
    | LwcTSTypeAnnotationType
    | LwcTSTypeParameterType
    | LwcTSTypeParameterDeclarationType
    | LwcTSTypeParameterInstantiationType;
