import {
    ATN,
    DFA,
    FailedPredicateException,
    Parser,
    RuleContext,
    ParserRuleContext,
    TerminalNode,
    TokenStream,
} from 'antlr4';
import ApexParserListener from './ApexParserListener.js';
import ApexParserVisitor from './ApexParserVisitor.js';

export declare class TriggerUnitContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    TRIGGER(): TerminalNode;
    id_list(): IdContext[];
    id(i: number): IdContext;
    ON(): TerminalNode;
    LPAREN(): TerminalNode;
    triggerCase_list(): TriggerCaseContext[];
    triggerCase(i: number): TriggerCaseContext;
    RPAREN(): TerminalNode;
    triggerBlock(): TriggerBlockContext;
    EOF(): TerminalNode;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class TriggerCaseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    BEFORE(): TerminalNode;
    AFTER(): TerminalNode;
    INSERT(): TerminalNode;
    UPDATE(): TerminalNode;
    DELETE(): TerminalNode;
    UNDELETE(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}

export declare class SoslPrimaryContext extends PrimaryContext {
    constructor(parser: ApexParser, ctx: PrimaryContext);
    soslLiteral(): SoslLiteralContext;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}

export declare class QueryContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    SELECT(): TerminalNode;
    selectList(): SelectListContext;
    FROM(): TerminalNode;
    fromNameList(): FromNameListContext;
    forClauses(): ForClausesContext;
    usingScope(): UsingScopeContext;
    whereClause(): WhereClauseContext;
    withClause(): WithClauseContext;
    groupByClause(): GroupByClauseContext;
    orderByClause(): OrderByClauseContext;
    limitClause(): LimitClauseContext;
    offsetClause(): OffsetClauseContext;
    allRowsClause(): AllRowsClauseContext;
    UPDATE(): TerminalNode;
    updateList(): UpdateListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SubQueryContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    SELECT(): TerminalNode;
    subFieldList(): SubFieldListContext;
    FROM(): TerminalNode;
    fromNameList(): FromNameListContext;
    forClauses(): ForClausesContext;
    whereClause(): WhereClauseContext;
    orderByClause(): OrderByClauseContext;
    limitClause(): LimitClauseContext;
    UPDATE(): TerminalNode;
    updateList(): UpdateListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SelectListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    selectEntry_list(): SelectEntryContext[];
    selectEntry(i: number): SelectEntryContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SelectEntryContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName(): FieldNameContext;
    soqlId(): SoqlIdContext;
    soqlFunction(): SoqlFunctionContext;
    LPAREN(): TerminalNode;
    subQuery(): SubQueryContext;
    RPAREN(): TerminalNode;
    typeOf(): TypeOfContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}

export declare class FromNameListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName_list(): FieldNameContext[];
    fieldName(i: number): FieldNameContext;
    soqlId_list(): SoqlIdContext[];
    soqlId(i: number): SoqlIdContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SubFieldListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    subFieldEntry_list(): SubFieldEntryContext[];
    subFieldEntry(i: number): SubFieldEntryContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SubFieldEntryContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName(): FieldNameContext;
    soqlId(): SoqlIdContext;
    soqlFunction(): SoqlFunctionContext;
    LPAREN(): TerminalNode;
    subQuery(): SubQueryContext;
    RPAREN(): TerminalNode;
    typeOf(): TypeOfContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SoqlFunctionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    AVG(): TerminalNode;
    LPAREN(): TerminalNode;
    fieldName(): FieldNameContext;
    RPAREN(): TerminalNode;
    COUNT(): TerminalNode;
    COUNT_DISTINCT(): TerminalNode;
    MIN(): TerminalNode;
    MAX(): TerminalNode;
    SUM(): TerminalNode;
    TOLABEL(): TerminalNode;
    FORMAT(): TerminalNode;
    soqlFunction(): SoqlFunctionContext;
    CALENDAR_MONTH(): TerminalNode;
    dateFieldName(): DateFieldNameContext;
    CALENDAR_QUARTER(): TerminalNode;
    CALENDAR_YEAR(): TerminalNode;
    DAY_IN_MONTH(): TerminalNode;
    DAY_IN_WEEK(): TerminalNode;
    DAY_IN_YEAR(): TerminalNode;
    DAY_ONLY(): TerminalNode;
    FISCAL_MONTH(): TerminalNode;
    FISCAL_QUARTER(): TerminalNode;
    FISCAL_YEAR(): TerminalNode;
    HOUR_IN_DAY(): TerminalNode;
    WEEK_IN_MONTH(): TerminalNode;
    WEEK_IN_YEAR(): TerminalNode;
    FIELDS(): TerminalNode;
    soqlFieldsParameter(): SoqlFieldsParameterContext;
    DISTANCE(): TerminalNode;
    locationValue_list(): LocationValueContext[];
    locationValue(i: number): LocationValueContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    StringLiteral(): TerminalNode;
    MultilineStringLiteral(): TerminalNode;
    GROUPING(): TerminalNode;
    CONVERT_CURRENCY(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class TypeOfContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    TYPEOF(): TerminalNode;
    fieldName(): FieldNameContext;
    END(): TerminalNode;
    whenClause_list(): WhenClauseContext[];
    whenClause(i: number): WhenClauseContext;
    elseClause(): ElseClauseContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WhenClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    WHEN(): TerminalNode;
    fieldName(): FieldNameContext;
    THEN(): TerminalNode;
    fieldNameList(): FieldNameListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WhereClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    WHERE(): TerminalNode;
    whereLogicalExpression(): WhereLogicalExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WhereLogicalExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    whereConditionalExpression_list(): WhereConditionalExpressionContext[];
    whereConditionalExpression(i: number): WhereConditionalExpressionContext;
    SOQLAND_list(): TerminalNode[];
    SOQLAND(i: number): TerminalNode;
    SOQLOR_list(): TerminalNode[];
    SOQLOR(i: number): TerminalNode;
    NOT(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WhereConditionalExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    LPAREN(): TerminalNode;
    whereLogicalExpression(): WhereLogicalExpressionContext;
    RPAREN(): TerminalNode;
    whereFieldExpression(): WhereFieldExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WhereFieldExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldExpression(): FieldExpressionContext;
    FORMULA(): TerminalNode;
    LPAREN(): TerminalNode;
    StringLiteral(): TerminalNode;
    RPAREN(): TerminalNode;
    comparisonOperator(): ComparisonOperatorContext;
    value(): ValueContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class LogicalExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    conditionalExpression_list(): ConditionalExpressionContext[];
    conditionalExpression(i: number): ConditionalExpressionContext;
    SOQLAND_list(): TerminalNode[];
    SOQLAND(i: number): TerminalNode;
    SOQLOR_list(): TerminalNode[];
    SOQLOR(i: number): TerminalNode;
    NOT(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class ConditionalExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    LPAREN(): TerminalNode;
    logicalExpression(): LogicalExpressionContext;
    RPAREN(): TerminalNode;
    fieldExpression(): FieldExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldExpressionContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName(): FieldNameContext;
    comparisonOperator(): ComparisonOperatorContext;
    value(): ValueContext;
    soqlFunction(): SoqlFunctionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class ValueContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    NULL(): TerminalNode;
    BooleanLiteral(): TerminalNode;
    signedNumber(): SignedNumberContext;
    StringLiteral(): TerminalNode;
    MultilineStringLiteral(): TerminalNode;
    DateLiteral(): TerminalNode;
    TimeLiteral(): TerminalNode;
    DateTimeLiteral(): TerminalNode;
    dateFormula(): DateFormulaContext;
    IntegralCurrencyLiteral(): TerminalNode;
    DOT(): TerminalNode;
    IntegerLiteral(): TerminalNode;
    LPAREN(): TerminalNode;
    subQuery(): SubQueryContext;
    RPAREN(): TerminalNode;
    valueList(): ValueListContext;
    boundExpression(): BoundExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class WithClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    WITH(): TerminalNode;
    DATA(): TerminalNode;
    CATEGORY(): TerminalNode;
    filteringExpression(): FilteringExpressionContext;
    SECURITY_ENFORCED(): TerminalNode;
    SYSTEM_MODE(): TerminalNode;
    USER_MODE(): TerminalNode;
    logicalExpression(): LogicalExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class GroupByClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    GROUP(): TerminalNode;
    BY(): TerminalNode;
    fieldGroupByList(): FieldGroupByListContext;
    ROLLUP(): TerminalNode;
    LPAREN(): TerminalNode;
    RPAREN(): TerminalNode;
    CUBE(): TerminalNode;
    HAVING(): TerminalNode;
    logicalExpression(): LogicalExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldGroupByListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldGroupBy_list(): FieldGroupByContext[];
    fieldGroupBy(i: number): FieldGroupByContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldGroupByContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName(): FieldNameContext;
    soqlFunction(): SoqlFunctionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class OrderByClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    ORDER(): TerminalNode;
    BY(): TerminalNode;
    fieldOrderList(): FieldOrderListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldOrderListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldOrder_list(): FieldOrderContext[];
    fieldOrder(i: number): FieldOrderContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldOrderContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldName(): FieldNameContext;
    NULLS(): TerminalNode;
    ASC(): TerminalNode;
    DESC(): TerminalNode;
    FIRST(): TerminalNode;
    LAST(): TerminalNode;
    soqlFunction(): SoqlFunctionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}

export declare class DateFormulaContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    YESTERDAY(): TerminalNode;
    TODAY(): TerminalNode;
    TOMORROW(): TerminalNode;
    LAST_WEEK(): TerminalNode;
    THIS_WEEK(): TerminalNode;
    NEXT_WEEK(): TerminalNode;
    LAST_MONTH(): TerminalNode;
    THIS_MONTH(): TerminalNode;
    NEXT_MONTH(): TerminalNode;
    LAST_90_DAYS(): TerminalNode;
    NEXT_90_DAYS(): TerminalNode;
    LAST_N_DAYS_N(): TerminalNode;
    COLON(): TerminalNode;
    signedInteger(): SignedIntegerContext;
    NEXT_N_DAYS_N(): TerminalNode;
    N_DAYS_AGO_N(): TerminalNode;
    NEXT_N_WEEKS_N(): TerminalNode;
    LAST_N_WEEKS_N(): TerminalNode;
    N_WEEKS_AGO_N(): TerminalNode;
    NEXT_N_MONTHS_N(): TerminalNode;
    LAST_N_MONTHS_N(): TerminalNode;
    N_MONTHS_AGO_N(): TerminalNode;
    THIS_QUARTER(): TerminalNode;
    LAST_QUARTER(): TerminalNode;
    NEXT_QUARTER(): TerminalNode;
    NEXT_N_QUARTERS_N(): TerminalNode;
    LAST_N_QUARTERS_N(): TerminalNode;
    N_QUARTERS_AGO_N(): TerminalNode;
    THIS_YEAR(): TerminalNode;
    LAST_YEAR(): TerminalNode;
    NEXT_YEAR(): TerminalNode;
    NEXT_N_YEARS_N(): TerminalNode;
    LAST_N_YEARS_N(): TerminalNode;
    N_YEARS_AGO_N(): TerminalNode;
    THIS_FISCAL_QUARTER(): TerminalNode;
    LAST_FISCAL_QUARTER(): TerminalNode;
    NEXT_FISCAL_QUARTER(): TerminalNode;
    NEXT_N_FISCAL_QUARTERS_N(): TerminalNode;
    LAST_N_FISCAL_QUARTERS_N(): TerminalNode;
    N_FISCAL_QUARTERS_AGO_N(): TerminalNode;
    THIS_FISCAL_YEAR(): TerminalNode;
    LAST_FISCAL_YEAR(): TerminalNode;
    NEXT_FISCAL_YEAR(): TerminalNode;
    NEXT_N_FISCAL_YEARS_N(): TerminalNode;
    LAST_N_FISCAL_YEARS_N(): TerminalNode;
    N_FISCAL_YEARS_AGO_N(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}

export declare class SoslLiteralContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    FindLiteral(): TerminalNode;
    soslClauses(): SoslClausesContext;
    RBRACK(): TerminalNode;
    LBRACK(): TerminalNode;
    FIND(): TerminalNode;
    boundExpression(): BoundExpressionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SoslLiteralAltContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    FindLiteralAlt(): TerminalNode;
    soslClauses(): SoslClausesContext;
    RBRACK(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SoslClausesContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    IN(): TerminalNode;
    searchGroup(): SearchGroupContext;
    RETURNING(): TerminalNode;
    fieldSpecList(): FieldSpecListContext;
    soslWithClause_list(): SoslWithClauseContext[];
    soslWithClause(i: number): SoslWithClauseContext;
    limitClause(): LimitClauseContext;
    UPDATE(): TerminalNode;
    updateList(): UpdateListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SoslWithClauseContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    WITH(): TerminalNode;
    DIVISION(): TerminalNode;
    ASSIGN(): TerminalNode;
    StringLiteral(): TerminalNode;
    MultilineStringLiteral(): TerminalNode;
    boundExpression(): BoundExpressionContext;
    DATA(): TerminalNode;
    CATEGORY(): TerminalNode;
    filteringExpression(): FilteringExpressionContext;
    SNIPPET(): TerminalNode;
    LPAREN(): TerminalNode;
    TARGET_LENGTH(): TerminalNode;
    IntegerLiteral(): TerminalNode;
    RPAREN(): TerminalNode;
    NETWORK(): TerminalNode;
    IN(): TerminalNode;
    networkList(): NetworkListContext;
    PRICEBOOKID(): TerminalNode;
    METADATA(): TerminalNode;
    HIGHLIGHT(): TerminalNode;
    SPELL_CORRECTION(): TerminalNode;
    BooleanLiteral(): TerminalNode;
    USER_MODE(): TerminalNode;
    SYSTEM_MODE(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class SearchGroupContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    FIELDS(): TerminalNode;
    ALL(): TerminalNode;
    EMAIL(): TerminalNode;
    NAME(): TerminalNode;
    PHONE(): TerminalNode;
    SIDEBAR(): TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldSpecListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    fieldSpec(): FieldSpecContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    fieldSpecList_list(): FieldSpecListContext[];
    fieldSpecList(i: number): FieldSpecListContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldSpecContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    soslId_list(): SoslIdContext[];
    soslId(i: number): SoslIdContext;
    LPAREN(): TerminalNode;
    fieldList(): FieldListContext;
    RPAREN(): TerminalNode;
    WHERE(): TerminalNode;
    logicalExpression(): LogicalExpressionContext;
    USING(): TerminalNode;
    LISTVIEW(): TerminalNode;
    ASSIGN(): TerminalNode;
    ORDER(): TerminalNode;
    BY(): TerminalNode;
    fieldOrderList(): FieldOrderListContext;
    limitClause(): LimitClauseContext;
    offsetClause(): OffsetClauseContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
export declare class FieldListContext extends ParserRuleContext {
    constructor(parser?: ApexParser, parent?: ParserRuleContext, invokingState?: number);
    soslId_list(): SoslIdContext[];
    soslId(i: number): SoslIdContext;
    COMMA_list(): TerminalNode[];
    COMMA(i: number): TerminalNode;
    fieldList_list(): FieldListContext[];
    fieldList(i: number): FieldListContext;
    TOLABEL(): TerminalNode;
    LPAREN(): TerminalNode;
    RPAREN(): TerminalNode;
    CONVERT_CURRENCY(): TerminalNode;
    FORMAT(): TerminalNode;
    soqlFunction(): SoqlFunctionContext;
    get ruleIndex(): number;
    enterRule(listener: ApexParserListener): void;
    exitRule(listener: ApexParserListener): void;
    accept<Result>(visitor: ApexParserVisitor<Result>): Result;
}
