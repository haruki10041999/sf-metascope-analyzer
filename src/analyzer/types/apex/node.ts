// Apex の JSON のすべてのノードの共用体と、kind から型を引く表 (docs/plan.md 5.1)。
// 走査 (processor/commons/node.ts の walk) で kind ごとに型を絞るのに使う。
// apex の JSON の型を足したら、ここにも足す (test/converter/json-node-union.test.ts が漏れを見つける)
import type * as J from './index';

/** Apex の JSON のすべてのノード */
export type ApexNodeJson =
    | J.AccessorContentJson
    | J.AllRowsJson
    | J.AnnotationArgJson
    | J.AnnotationJson
    | J.AnonymousUnitJson
    | J.ApexClassMetaJson
    | J.ApexMetaJson
    | J.ApexTriggerMetaJson
    | J.AssignmentJson
    | J.BaseExpressionJson
    | J.BinaryJson
    | J.BlockMemberJson
    | J.BlockStatementJson
    | J.BooleanLiteralJson
    | J.BreakStatementJson
    | J.CallJson
    | J.CastJson
    | J.ClassDeclarationJson
    | J.ClassLiteralJson
    | J.CompilationUnitJson
    | J.ConditionalJson
    | J.ConstructorDeclarationJson
    | J.ContinueStatementJson
    | J.CoordinateElementJson
    | J.CoordinateValueJson
    | J.DataCategorySelectionJson
    | J.DateFieldNameJson
    | J.DecimalLiteralJson
    | J.DeclarationNameJson
    | J.DeleteStatementJson
    | J.DistanceValueJson
    | J.DoWhileStatementJson
    | J.DotMethodCallJson
    | J.EnumConstantJson
    | J.EnumDeclarationJson
    | J.ExpressionStatementJson
    | J.FieldDeclarationJson
    | J.FieldJson
    | J.FieldOrderJson
    | J.FieldSpecJson
    | J.ForConditionJson
    | J.ForEachStatementJson
    | J.ForJson
    | J.ForStatementJson
    | J.FormulaFieldJson
    | J.FromJson
    | J.GroupByJson
    | J.IdentifierJson
    | J.IfConditionBlockJson
    | J.IfStatementJson
    | J.IndexJson
    | J.InitializerBlockJson
    | J.InsertStatementJson
    | J.InstanceofJson
    | J.IntegerLiteralJson
    | J.InterfaceDeclarationJson
    | J.InterfaceMethodJson
    | J.LimitJson
    | J.LiteralJson
    | J.LocalVariableDeclarationJson
    | J.LocalVariableStatementJson
    | J.LocationValueElementJson
    | J.LogicalConditionJson
    | J.LogicalJson
    | J.LongLiteralJson
    | J.MemberDeclarationJson
    | J.MergeStatementJson
    | J.MethodDeclarationJson
    | J.ModifierJson
    | J.ModifiersJson
    | J.NewEntryJson
    | J.NewJson
    | J.NotSetBlockJson
    | J.NullLiteralJson
    | J.OffsetJson
    | J.OrderByJson
    | J.PackageVersionJson
    | J.ParameterJson
    | J.ParenthesizedJson
    | J.PrimaryJson
    | J.PropertyDeclarationJson
    | J.ReturnStatementJson
    | J.RunAsStatementJson
    | J.SelectEntryJson
    | J.SelectJson
    | J.SingleConditionJson
    | J.SoqlFunctionJson
    | J.SoqlJson
    | J.SoslFieldJson
    | J.SoslFindJson
    | J.SoslJson
    | J.SoslWithJson
    | J.SoslWithValueJson
    | J.StatementJson
    | J.StringLiteralJson
    | J.SubQueryJson
    | J.SuperJson
    | J.SwitchStatementJson
    | J.SwitchWhenJson
    | J.ThisJson
    | J.ThrowStatementJson
    | J.TriggerCaseJson
    | J.TriggerUnitJson
    | J.TryClauseJson
    | J.TryStatementJson
    | J.TypeJson
    | J.TypeOfBlockJson
    | J.UnaryJson
    | J.UndeleteStatementJson
    | J.UnsupportedJson
    | J.UpdateListJson
    | J.UpdateStatementJson
    | J.UpsertStatementJson
    | J.UsingScopeJson
    | J.ValueJson
    | J.VariantJson
    | J.WhenConditionJson
    | J.WhenLiteralJson
    | J.WhenTypeJson
    | J.WhereJson
    | J.WhileStatementJson
    | J.WithJson;

/** Apex の JSON のノードの kind */
export type ApexNodeKind = ApexNodeJson['kind'];

/** kind が K の Apex のノード */
export type ApexNodeOf<K extends ApexNodeKind> = Extract<ApexNodeJson, { kind: K }>;
