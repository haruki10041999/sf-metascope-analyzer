// 同じバンドルの中の突き合わせ (docs/lwc-implementation.md)。
// template-compiler はテンプレートだけを見るので、テンプレートの式・ハンドラー・lwc:ref が JS のメンバーと合っているか、
// lwc:component を使ってよいか (js-meta.xml の capabilities) は、JSON がそろったところでここで見る。
// 誤検出がありうる (継承・mixin のメンバーは JSON にない) ので、すべて phase bundle・level warning
// 本体の呼び出し (this.refs.<名前>) は JSON に持たず、解析で文の JSON から出す (docs/lwc-json-types.md 8.8)。
// 解析の部品は types だけに依存するので、parser から使っても循環しない
import { analyzeLwcModuleCalls, type LwcCallInfo } from '../../../processor/Lwc/calls';
import { lwcHeritageOf } from '../../../processor/Lwc/walker';
import {
    findSpanSourceInfo,
    hash,
    type ConvertKeys,
    type LwcAttributeValueJson,
    type LwcBundleJson,
    type LwcComponentJson,
    type LwcExpressionJson,
    type LwcModuleJson,
    type LwcSourceJson,
    type LwcTemplateNodeJson,
} from '../../../types';

import type { LwcResolvedError } from '../errorListener';

export type LwcBundleCheckCode =
    | 'TEMPLATE_UNKNOWN_MEMBER'
    | 'TEMPLATE_UNKNOWN_HANDLER'
    | 'TEMPLATE_UNKNOWN_REF'
    | 'TEMPLATE_DYNAMIC_DISABLED';

/** メンバーを足さない (テンプレートから参照されるメンバーを持たない) と分かっている mixin */
const KNOWN_MIXINS = ['NavigationMixin'];

const DYNAMIC_COMPONENT_CAPABILITY = 'lightning__dynamicComponent';

type Finding = {
    code: LwcBundleCheckCode;
    contextType: string;
    message: string;
    sourceKeys: ConvertKeys;
};

/** テンプレートの中で、式を持つところ (sourceKeys はその属性・テキストなど) */
type ExpressionUse = {
    expression: LwcExpressionJson;
    sourceKeys: ConvertKeys;
    /** イベントハンドラーか */
    handler: boolean;
};

const expressionOf = (value: LwcAttributeValueJson | undefined) =>
    value?.type === 'expression' ? value.expression : undefined;

/** テンプレートの式・lwc:ref・動的コンポーネントを集める */
const collectTemplate = (nodes: LwcTemplateNodeJson[]) => {
    const uses: ExpressionUse[] = [];
    const refs = new Set<string>();
    const dynamics: ConvertKeys[] = [];
    const push = (
        value: LwcAttributeValueJson | undefined,
        sourceKeys: ConvertKeys,
        handler = false,
    ) => {
        const expression = expressionOf(value);
        if (expression) uses.push({ expression, sourceKeys, handler });
    };

    const visit = (list: LwcTemplateNodeJson[]) => {
        for (const node of list) {
            switch (node.kind) {
                case 'lwcText':
                    node.expressions.forEach((expression) =>
                        uses.push({ expression, sourceKeys: node.sourceKeys, handler: false }),
                    );
                    break;
                case 'lwcIf':
                    for (const branch of node.branches) {
                        push(branch.condition, branch.sourceKeys);
                        visit(branch.children);
                    }
                    break;
                case 'lwcForEach':
                    push(node.items, node.sourceKeys);
                    visit(node.children);
                    break;
                case 'lwcElement':
                    if (node.elementType === 'dynamic') dynamics.push(node.sourceKeys);
                    node.attributes.forEach((a) => push(a.value, a.sourceKeys));
                    for (const directive of node.directives) {
                        if (directive.name === 'lwc:ref' && directive.value.type === 'static') {
                            refs.add(directive.value.value);
                        }
                        push(directive.value, directive.sourceKeys);
                    }
                    node.events.forEach((e) => push(e.handler, e.sourceKeys, true));
                    visit(node.children);
                    break;
            }
        }
    };
    visit(nodes);
    return { uses, refs, dynamics };
};

/** コンポーネントのメンバー名 (フィールド・getter / setter・メソッド) */
const memberNamesOf = (component: LwcComponentJson) =>
    new Set(
        component.block.flatMap((member) =>
            member.kind !== 'lwcConstructor' && member.kind !== 'lwcStaticBlock'
                ? [member.name]
                : [],
        ),
    );

/** メンバーがすべて JSON にあるか (LightningElement を直接継承し、mixin は既知のものだけ) */
const hasAllMembers = (component: LwcComponentJson) => {
    const { extend, mixins } = lwcHeritageOf(component.superClass);
    return (
        extend === 'LightningElement' &&
        mixins.every((mixin) => mixin !== null && KNOWN_MIXINS.includes(mixin))
    );
};

/** JS の this.refs.<名前> (解析の呼び出しの callType: 'refs') */
const refCallsOf = (module: LwcModuleJson): LwcCallInfo[] =>
    analyzeLwcModuleCalls(module)
        // コンポーネントのメソッド・getter / setter・関数を初期値にしたフィールド (handleClick = () => {...}) の本体
        .filter((content) => content.ownerKind === 'lwcComponent')
        .flatMap((content) => content.calls)
        .filter((call) => call.callType === 'refs');

/** 突き合わせの結果を resolvedError にする。位置は sourceObject から引く (見つからなければ出さない) */
const toResolvedError = (
    finding: Finding,
    sourceObject: LwcSourceJson[],
): LwcResolvedError | undefined => {
    let info;
    try {
        info = findSpanSourceInfo(sourceObject, finding.sourceKeys);
    } catch {
        return undefined;
    }
    const content = {
        phase: 'bundle' as const,
        code: finding.code,
        level: 'warning' as const,
        contextType: finding.contextType,
        context: info.context,
        errorMessage: finding.message,
    };
    return {
        sourceKeys: {
            objectKey: `error_${hash(content)}`,
            sourceKey: `error_${hash({ filePath: info.filePath, start: info.start, end: info.end })}`,
        },
        ...content,
        filePath: info.filePath,
        start: info.start,
        end: info.end,
    };
};

/**
 * バンドルの中の突き合わせ。メインのモジュールのコンポーネントと、すべてのテンプレート
 * (render() で切り替えるものも) を比べる。どちらかが読めなければ (null) 見ない
 */
export const validateBundle = (
    bundle: LwcBundleJson,
    sourceObject: LwcSourceJson[],
): LwcResolvedError[] => {
    const main = bundle.modules.find((m) => m.main)?.module;
    const component = main?.component;
    const templates = bundle.templates.flatMap((t) => (t.template ? [t.template] : []));
    if (!main || !component || templates.length === 0) return [];

    const collected = templates.map((template) => collectTemplate(template.children));
    const members = memberNamesOf(component);
    const checkMembers = hasAllMembers(component);
    const findings: Finding[] = [];

    for (const { uses, dynamics } of collected) {
        for (const use of uses) {
            const name = use.expression.path?.[0];
            if (!checkMembers || use.expression.local || !name || members.has(name)) continue;
            findings.push(
                use.handler
                    ? {
                          code: 'TEMPLATE_UNKNOWN_HANDLER',
                          contextType: name,
                          message: `イベントハンドラー ${name} がコンポーネントのメンバーにない`,
                          sourceKeys: use.sourceKeys,
                      }
                    : {
                          code: 'TEMPLATE_UNKNOWN_MEMBER',
                          contextType: name,
                          message: `{${use.expression.text}} の ${name} がコンポーネントのメンバーにない`,
                          sourceKeys: use.sourceKeys,
                      },
            );
        }

        // js-meta.xml が読めなかった (null) ときは見ない
        const capabilities = bundle.meta?.capabilities ?? [];
        if (bundle.meta !== null && !capabilities.includes(DYNAMIC_COMPONENT_CAPABILITY)) {
            dynamics.forEach((sourceKeys) =>
                findings.push({
                    code: 'TEMPLATE_DYNAMIC_DISABLED',
                    contextType: 'lwc:component',
                    message: `lwc:component を使うには js-meta.xml の capabilities に ${DYNAMIC_COMPONENT_CAPABILITY} が要る`,
                    sourceKeys,
                }),
            );
        }
    }

    // JS の this.refs.<名前> が、どのテンプレートの lwc:ref にもない
    const refs = new Set(collected.flatMap((c) => [...c.refs]));
    for (const call of refCallsOf(main)) {
        if (refs.has(call.target)) continue;
        findings.push({
            code: 'TEMPLATE_UNKNOWN_REF',
            contextType: call.target,
            message: `this.refs.${call.target} の lwc:ref="${call.target}" がテンプレートにない`,
            sourceKeys: call.sourceKeys,
        });
    }

    return findings.flatMap((finding) => toResolvedError(finding, sourceObject) ?? []);
};
