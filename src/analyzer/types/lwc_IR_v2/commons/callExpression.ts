import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isCallExpression, isImport, isSuper, type CallExpression } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import {
    v8IntrinsicIdentifierTypePair,
    type V8IntrinsicIdentifierTypeClass,
} from '../miscellaneousVisitor/v8IntrinsicIdentifier';
import { ImportTypeClass } from '../standardizedVisitor/import';
import { SuperTypeClass } from '../standardizedVisitor/super';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import {
    argumentPlaceholderTypePair,
    type ArgumentPlaceholderTypeClass,
} from './argumentPlaceholder';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const callExpressionCalleePairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), v8IntrinsicIdentifierTypePair] as const,
);
const callExpressionArgumentsPairs = lazyPairs(
    () =>
        [
            ...expressionVisitorEvaluatePairs(),
            spreadElementTypePair,
            argumentPlaceholderTypePair,
        ] as const,
);
const callExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

/** 呼び出しの引数 */
export type CallArgumentTypeClass =
    ExpressionTypeClass | SpreadElementTypeClass | ArgumentPlaceholderTypeClass;

/**
 * callee の種類ごとに、引数に書けるものが決まる。
 * - super: `super(...)` (constructor の中)
 * - import: 旧い形の `import(source)` / `import(source, options)`。引数は 1〜2 個で spread は書けない
 *   (Babel 8 の既定 (createImportExpressions) では ImportExpression になり、ここには来ない)
 * - normal: そのほかの呼び出し
 */
type CallExpressionCalleeFields =
    | { kind: 'super'; callee: SuperTypeClass; arguments: CallArgumentTypeClass[] }
    | {
          kind: 'import';
          callee: ImportTypeClass;
          arguments: [ExpressionTypeClass] | [ExpressionTypeClass, ExpressionTypeClass];
      }
    | {
          kind: 'normal';
          callee: ExpressionTypeClass | V8IntrinsicIdentifierTypeClass;
          arguments: CallArgumentTypeClass[];
      };

export type CallExpressionFields = TypeField<'callExpression'> & {
    typeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
} & CallExpressionCalleeFields;

const createCalleeFields = (
    target: CallExpression,
    originalSource: string,
): CallExpressionCalleeFields => {
    const callArguments = (): CallArgumentTypeClass[] =>
        visitNodeList(
            target.arguments,
            originalSource,
            callExpressionArgumentsPairs(),
            'CallExpression.arguments',
        );

    if (isSuper(target.callee)) {
        return {
            kind: 'super',
            callee: SuperTypeClass.create(target.callee, originalSource),
            arguments: callArguments(),
        };
    }
    if (isImport(target.callee)) {
        const importArguments = target.arguments.map((child) =>
            visitNode(child, originalSource, expressionVisitorEvaluatePairs(), 'ExpressionVisitor'),
        );
        const [source, options, ...rest] = importArguments;
        if (source == null || rest.length > 0) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'import() の引数は 1〜2 個です',
            );
        }
        return {
            kind: 'import',
            callee: ImportTypeClass.create(target.callee, originalSource),
            arguments: options == null ? [source] : [source, options],
        };
    }
    return {
        kind: 'normal',
        callee: visitNode(
            target.callee,
            originalSource,
            callExpressionCalleePairs(),
            'CallExpression.callee',
        ),
        arguments: callArguments(),
    };
};

export class CallExpressionTypeClass extends LwcCommonTypeClass<
    'callExpression',
    CallExpressionFields
> {
    private constructor(value: FieldsOf<CallExpressionFields>, sourceSpan: SourceSpan) {
        super('callExpression', value, sourceSpan);
    }

    static create(target: CallExpression, originalSource: string): CallExpressionTypeClass {
        return new CallExpressionTypeClass(
            {
                ...createCalleeFields(target, originalSource),
                typeArguments: visitOptionalNode(
                    target.typeArguments,
                    originalSource,
                    callExpressionTypeArgumentsPairs(),
                    'CallExpression.typeArguments',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): CallExpressionFields['kind'] {
        return this.getFields().kind;
    }

    getCallee(): CallExpressionFields['callee'] {
        return this.getFields().callee;
    }

    getArguments(): CallExpressionFields['arguments'] {
        return this.getFields().arguments;
    }

    getTypeArguments(): CallExpressionFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const callExpressionTypePair: EvaluatePair<CallExpression, CallExpressionTypeClass> =
    makeEvaluatePair(isCallExpression, (target, originalSource) =>
        CallExpressionTypeClass.create(target, originalSource),
    );

export const isCallExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is CallExpressionTypeClass => target instanceof CallExpressionTypeClass;
