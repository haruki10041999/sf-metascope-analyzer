import { useState } from 'react';

import type { CallSequence, CallSequenceMessage } from '../../../analyzer/report/types';

// Apex の呼び出しのシーケンス図 (apex.callFlow)。参加者 (クラス・Database など) を列に、メッセージを上から順に矢印で描く (SVG)。
// 色は styles.css の --flow-*。ループの中の SOQL / DML には ⚠ を付ける

const COLUMN_WIDTH = 180;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 30;
const PADDING = 16;
const LABEL_LENGTH = 30;

const KIND_COLORS: Record<CallSequenceMessage['kind'], string> = {
    call: 'var(--ring)',
    query: 'var(--flow-query)',
    dml: 'var(--flow-dml)',
    async: 'var(--flow-loop)',
    callout: 'var(--flow-callout)',
    publish: 'var(--flow-event)',
};

const KIND_LABELS: Record<CallSequenceMessage['kind'], string> = {
    call: '呼び出し',
    query: 'SOQL / SOSL',
    dml: 'DML',
    async: '非同期',
    callout: '外部の呼び出し',
    publish: 'イベントの発行',
};

const shorten = (text: string, length: number) =>
    text.length > length ? `${text.slice(0, length - 1)}…` : text;

const OneSequence = ({ sequence }: { sequence: CallSequence }) => {
    const columns = sequence.participants;
    const x = (name: string) => PADDING + columns.indexOf(name) * COLUMN_WIDTH + COLUMN_WIDTH / 2;
    const width = PADDING * 2 + columns.length * COLUMN_WIDTH;
    const height = HEADER_HEIGHT + PADDING * 2 + Math.max(1, sequence.messages.length) * ROW_HEIGHT;
    if (sequence.messages.length === 0) {
        return <p className="text-muted-foreground text-sm">呼び出し・SOQL・DML がありません</p>;
    }
    return (
        <div className="bg-background w-full overflow-x-auto rounded-lg border">
            <svg
                width={width}
                height={height}
                role="img"
                aria-label={`${sequence.start} のシーケンス図`}
            >
                <defs>
                    {Object.entries(KIND_COLORS).map(([kind, color]) => (
                        <marker
                            key={kind}
                            id={`arrow-${kind}`}
                            viewBox="0 0 10 10"
                            refX="9"
                            refY="5"
                            markerWidth="7"
                            markerHeight="7"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                        </marker>
                    ))}
                </defs>
                {columns.map((name) => (
                    <g key={name}>
                        <line
                            x1={x(name)}
                            x2={x(name)}
                            y1={PADDING + HEADER_HEIGHT}
                            y2={height - PADDING}
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                        />
                        <rect
                            x={x(name) - COLUMN_WIDTH / 2 + 8}
                            y={PADDING}
                            width={COLUMN_WIDTH - 16}
                            height={HEADER_HEIGHT - 8}
                            rx={6}
                            fill="var(--card)"
                            stroke="var(--foreground)"
                        />
                        <text
                            x={x(name)}
                            y={PADDING + (HEADER_HEIGHT - 8) / 2 + 4}
                            textAnchor="middle"
                            fontSize={12}
                            fill="var(--card-foreground)"
                        >
                            <title>{name}</title>
                            {shorten(name, 24)}
                        </text>
                    </g>
                ))}
                {sequence.messages.map((message, index) => {
                    const y = PADDING + HEADER_HEIGHT + ROW_HEIGHT * (index + 0.75);
                    const from = x(message.from);
                    const to = x(message.to);
                    const color = KIND_COLORS[message.kind];
                    // 呼んだ先のメソッドの中の出来事は、段の数だけ › を付ける
                    const label = `${'› '.repeat(message.depth - 1)}${message.inLoop ? '⚠ ' : ''}${shorten(message.label, LABEL_LENGTH)}`;
                    const title = [
                        `${KIND_LABELS[message.kind]}: ${message.from} → ${message.to}`,
                        message.label,
                        message.line !== undefined ? `${message.line} 行目` : null,
                        message.inLoop ? 'ループの中' : null,
                        `段: ${message.depth}`,
                    ]
                        .filter(Boolean)
                        .join('\n');
                    const self = from === to;
                    return (
                        <g key={index}>
                            <title>{title}</title>
                            {self ? (
                                <path
                                    d={`M ${from} ${y - 8} h 28 v 12 h -26`}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={1.5}
                                    markerEnd={`url(#arrow-${message.kind})`}
                                />
                            ) : (
                                <line
                                    x1={from}
                                    x2={to + (to > from ? -2 : 2)}
                                    y1={y}
                                    y2={y}
                                    stroke={color}
                                    strokeWidth={1.5}
                                    markerEnd={`url(#arrow-${message.kind})`}
                                />
                            )}
                            <text
                                x={self ? from + 34 : Math.min(from, to) + 8}
                                y={self ? y + 2 : y - 5}
                                fontSize={11}
                                fill={
                                    message.inLoop
                                        ? 'var(--flow-exception)'
                                        : 'var(--card-foreground)'
                                }
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const SequenceDiagramView = ({
    data,
    start,
}: {
    data: CallSequence[] | undefined;
    start?: string | null | undefined;
}) => {
    const sequences = (data ?? []).filter((sequence) => !start || sequence.start === start);
    const [index, setIndex] = useState(0);
    if (sequences.length === 0) {
        return <p className="text-muted-foreground text-sm">図にする呼び出しがありません</p>;
    }
    const current = Math.min(index, sequences.length - 1);
    const sequence = sequences[current]!;
    return (
        <div className="flex flex-col gap-2">
            {sequences.length > 1 && (
                <select
                    className="bg-background w-fit max-w-full rounded-md border px-2 py-1 text-sm"
                    value={current}
                    onChange={(event) => setIndex(Number(event.target.value))}
                >
                    {sequences.map((item, i) => (
                        <option key={item.start} value={i}>
                            {item.start}
                        </option>
                    ))}
                </select>
            )}
            <OneSequence key={sequence.start} sequence={sequence} />
            {sequence.truncated && (
                <p className="text-muted-foreground text-xs">
                    メッセージが多いので途中で切りました (depth を小さくすると減ります)
                </p>
            )}
        </div>
    );
};
