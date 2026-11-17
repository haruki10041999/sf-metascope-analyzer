import { type ReactNode, useState } from 'react';

import type { LwcWireframe, WireframeNode } from '../../../analyzer/report/types';

import { STATUS_LABELS, statusOf } from './status';

// LWC のワイヤーフレーム (lwc.wireframe。docs/lwc-snapshot-plan.md 4 章の方式 A)。
// テンプレートから描き、JS は実行しない。式は ‹x› の置き場所、分岐はタブ、繰り返しは 1 件分と「× n」、
// lightning-* は種類ごとの簡単な絵、c-* は枠と名前で、展開すると子コンポーネントを入れ子に描く (深さの上限あり)

type Components = Map<string, LwcWireframe['components'][number]>;
type Context = { components: Components; depth: number; path: string[] };

const MAX_DEPTH = 4;

/** {x} を ‹x› の置き場所にして描く */
const TextWithExpressions = ({ text }: { text: string }) => (
    <>
        {text.split(/(\{[^}]*\})/).map((part, i) =>
            part.startsWith('{') && part.endsWith('}') ? (
                <span
                    key={i}
                    className="bg-muted text-muted-foreground rounded px-1 font-mono text-[11px]"
                >
                    ‹{part.slice(1, -1)}›
                </span>
            ) : (
                <span key={i}>{part}</span>
            ),
        )}
    </>
);

const attr = (node: WireframeNode, name: string) =>
    node.attributes?.find((a) => a.name === name)?.value;

/** slot="x" の子を分ける (lightning-card の actions・footer など) */
const bySlot = (children: WireframeNode[] = []) => {
    const slots = new Map<string, WireframeNode[]>();
    for (const child of children) {
        const slot = attr(child, 'slot') ?? '';
        slots.set(slot, [...(slots.get(slot) ?? []), child]);
    }
    return slots;
};

const Nodes = ({ nodes, context }: { nodes: WireframeNode[] | undefined; context: Context }) => (
    <>
        {(nodes ?? []).map((node, i) => (
            <Node key={i} node={node} context={context} />
        ))}
    </>
);

const Label = ({ value }: { value: string | undefined }) =>
    value ? <TextWithExpressions text={value} /> : null;

const Box = ({
    title,
    children,
    dashed = false,
    className = '',
}: {
    title: ReactNode;
    children?: ReactNode;
    dashed?: boolean;
    className?: string;
}) => (
    <div className={`my-1 rounded border ${dashed ? 'border-dashed' : ''} p-2 ${className}`}>
        <div className="text-muted-foreground mb-1 text-[11px]">{title}</div>
        {children}
    </div>
);

/** lightning-* の簡単な絵 */
const BaseComponent = ({ node, context }: { node: WireframeNode; context: Context }) => {
    const name = node.module?.replace(/^lightning\//, '') ?? node.tag ?? '';
    const label = attr(node, 'label') ?? attr(node, 'title') ?? attr(node, 'alternative-text');
    switch (name) {
        case 'button':
        case 'buttonStateful':
            return (
                <span className="bg-primary text-primary-foreground m-1 inline-block rounded px-3 py-1 text-xs">
                    <Label value={label ?? 'ボタン'} />
                </span>
            );
        case 'buttonIcon':
        case 'icon':
            return (
                <span
                    className="m-1 inline-block rounded border px-1 text-xs"
                    title={attr(node, 'icon-name')}
                >
                    ◇ {attr(node, 'icon-name') ?? ''}
                </span>
            );
        case 'input':
        case 'textarea':
        case 'combobox':
        case 'inputField':
        case 'outputField':
        case 'formattedText':
        case 'formattedNumber': {
            const field = attr(node, 'field-name');
            return (
                <div className="my-1 text-xs">
                    <div className="text-muted-foreground">
                        <Label value={label ?? field ?? name} />
                    </div>
                    <div className="bg-background h-6 rounded border px-1">
                        {name === 'combobox' ? '▾' : <Label value={attr(node, 'value')} />}
                    </div>
                </div>
            );
        }
        case 'card': {
            const slots = bySlot(node.children);
            return (
                <div className="bg-card my-1 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold">
                        <span>
                            <Label value={attr(node, 'title') ?? 'カード'} />
                        </span>
                        <span>
                            <Nodes nodes={slots.get('actions')} context={context} />
                        </span>
                    </div>
                    <div className="p-3">
                        <Nodes nodes={slots.get('')} context={context} />
                    </div>
                    {slots.has('footer') && (
                        <div className="border-t px-3 py-2">
                            <Nodes nodes={slots.get('footer')} context={context} />
                        </div>
                    )}
                </div>
            );
        }
        case 'datatable':
            return (
                <Box title={`表 (lightning-datatable)`}>
                    <div className="text-xs">
                        列: <Label value={attr(node, 'columns')} />
                        ・行: <Label value={attr(node, 'data')} />
                    </div>
                </Box>
            );
        case 'spinner':
            return <span className="text-muted-foreground text-xs">○ 読み込み中</span>;
        case 'recordForm':
        case 'recordEditForm':
        case 'recordViewForm':
            return (
                <Box
                    title={
                        <>
                            レコードフォーム ({name}){' '}
                            <Label value={attr(node, 'object-api-name')} />
                        </>
                    }
                >
                    <Nodes nodes={node.children} context={context} />
                </Box>
            );
        default:
            return (
                <Box title={`lightning-${node.tag?.replace(/^lightning-/, '') ?? name}`}>
                    {label && (
                        <div className="text-xs">
                            <Label value={label} />
                        </div>
                    )}
                    <Nodes nodes={node.children} context={context} />
                </Box>
            );
    }
};

/** c-* (同じ名前空間) の子コンポーネント。展開すると、その画面を入れ子に描く */
const LocalComponent = ({ node, context }: { node: WireframeNode; context: Context }) => {
    const [open, setOpen] = useState(false);
    const module = node.module ?? '';
    const child = context.components.get(module);
    const loop = context.path.includes(module);
    const canOpen = child !== undefined && !loop && context.depth < MAX_DEPTH;
    const passed = (node.attributes ?? []).filter((a) => a.name !== 'class' && a.name !== 'slot');
    return (
        <div className="border-primary/40 my-1 rounded border-2 p-2">
            <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">{module}</span>
                {passed.map((a) => (
                    <span key={a.name} className="text-muted-foreground">
                        {a.name}=<Label value={a.value} />
                    </span>
                ))}
                {node.events?.length ? (
                    <span className="text-muted-foreground">on: {node.events.join(', ')}</span>
                ) : null}
                {canOpen && (
                    <button className="ml-auto rounded border px-2" onClick={() => setOpen(!open)}>
                        {open ? '閉じる' : '展開する'}
                    </button>
                )}
                {!child && <span className="ml-auto text-muted-foreground">(バンドルがない)</span>}
            </div>
            {node.children && node.children.length > 0 && (
                <div className="mt-1">
                    <Nodes nodes={node.children} context={context} />
                </div>
            )}
            {open && child && (
                <div className="mt-2 border-t pt-2">
                    <ComponentBody
                        component={child}
                        context={{
                            ...context,
                            depth: context.depth + 1,
                            path: [...context.path, module],
                        }}
                    />
                </div>
            )}
        </div>
    );
};

const Branches = ({ node, context }: { node: WireframeNode; context: Context }) => {
    const [selected, setSelected] = useState(0);
    const branches = node.branches ?? [];
    return (
        <div className="my-1 rounded border border-dashed p-2">
            <div className="mb-1 flex flex-wrap gap-1">
                {branches.map((branch, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(i)}
                        className={`rounded border px-2 font-mono text-[11px] ${i === selected ? 'bg-muted' : ''}`}
                    >
                        {branch.label}
                    </button>
                ))}
            </div>
            <Nodes nodes={branches[selected]?.children} context={context} />
        </div>
    );
};

const Node = ({ node, context }: { node: WireframeNode; context: Context }) => {
    switch (node.type) {
        case 'text':
            return (
                <span className="text-sm">
                    <TextWithExpressions text={node.text ?? ''} />{' '}
                </span>
            );
        case 'if':
            return <Branches node={node} context={context} />;
        case 'for':
            return (
                <div className="relative my-1 rounded border border-dashed p-2">
                    <span className="bg-muted absolute -top-2 right-2 rounded px-1 font-mono text-[10px]">
                        × n ({node.items}
                        {node.text ? ` as ${node.text}` : ''})
                    </span>
                    <Nodes nodes={node.children} context={context} />
                </div>
            );
        case 'slot':
            return (
                <Box title={`slot${node.text ? `: ${node.text}` : ''}`} dashed>
                    <Nodes nodes={node.children} context={context} />
                </Box>
            );
        case 'component':
            if (node.source === 'lightning') return <BaseComponent node={node} context={context} />;
            if (node.source === 'local') return <LocalComponent node={node} context={context} />;
            return (
                <Box title={node.module ?? node.tag}>
                    <Nodes nodes={node.children} context={context} />
                </Box>
            );
        case 'element': {
            const tag = node.tag ?? 'div';
            if (/^h[1-6]$/.test(tag)) {
                return (
                    <div className="my-1 text-base font-semibold">
                        <Nodes nodes={node.children} context={context} />
                    </div>
                );
            }
            if (['p', 'span', 'a', 'strong', 'em', 'label', 'li'].includes(tag)) {
                const Tag = tag === 'li' ? 'div' : 'span';
                return (
                    <Tag className={tag === 'p' || tag === 'li' ? 'my-1 block text-sm' : 'text-sm'}>
                        {tag === 'li' ? '・' : ''}
                        <Nodes nodes={node.children} context={context} />
                    </Tag>
                );
            }
            if (tag === 'img')
                return <span className="m-1 inline-block rounded border px-2 text-xs">画像</span>;
            if (tag === 'input' || tag === 'select' || tag === 'textarea') {
                return <span className="bg-background m-1 inline-block h-6 w-32 rounded border" />;
            }
            if (tag === 'button') {
                return (
                    <span className="m-1 inline-block rounded border px-3 py-1 text-xs">
                        <Nodes nodes={node.children} context={context} />
                    </span>
                );
            }
            return (
                <div className="my-0.5">
                    <Nodes nodes={node.children} context={context} />
                </div>
            );
        }
    }
};

const ComponentBody = ({
    component,
    context,
}: {
    component: LwcWireframe['components'][number];
    context: Context;
}) => {
    const [selected, setSelected] = useState(
        Math.max(
            0,
            component.templates.findIndex((t) => t.main),
        ),
    );
    if (component.templates.length === 0) {
        return <div className="text-muted-foreground text-xs">テンプレートがない</div>;
    }
    return (
        <div>
            {component.templates.length > 1 && (
                <div className="mb-1 flex gap-1">
                    {component.templates.map((t, i) => (
                        <button
                            key={t.fileName}
                            onClick={() => setSelected(i)}
                            className={`rounded border px-2 text-[11px] ${i === selected ? 'bg-muted' : ''}`}
                        >
                            {t.fileName}
                        </button>
                    ))}
                </div>
            )}
            <Nodes nodes={component.templates[selected]?.nodes} context={context} />
        </div>
    );
};

export const LwcWireframeView = ({
    data,
    component,
}: {
    data: LwcWireframe | undefined;
    component?: string | null | undefined;
}) => {
    if (!data) return null;
    const components: Components = new Map(data.components.map((c) => [c.component, c]));
    const roots = data.roots.filter(
        (root) => !component || root === component || root.endsWith(`/${component}`),
    );
    if (roots.length === 0) {
        return <div className="text-muted-foreground text-sm">コンポーネントがありません</div>;
    }
    return (
        <div className="flex flex-col gap-4">
            {roots.map((root) => {
                const item = components.get(root);
                if (!item) return null;
                const status = statusOf(item);
                return (
                    <div key={root} className="flex flex-col gap-1">
                        <div className="text-sm font-medium">
                            {item.label ? `${item.label} (${root})` : root}
                            {status !== 'unchanged' ? `・${STATUS_LABELS[status]}` : ''}
                        </div>
                        <div className="bg-background rounded-lg border p-3">
                            <ComponentBody
                                component={item}
                                context={{ components, depth: 0, path: [root] }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
