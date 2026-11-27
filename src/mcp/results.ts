// MCP のツールの結果 (テキスト 1 つ)。値は provider の行・依存関係のグラフ・ノードなど、ツールごとに形が違うので
// unknown で受け、JSON の文字列にして返す (そのままでよい unknown。docs/plan.md 10 章 P2)

/** 値を JSON (2 字下げ) のテキストの結果にする */
export const jsonResult = (value: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

/** 文字列はそのまま、ほかの値は JSON のテキストの結果にする */
export const textResult = (value: unknown) => ({
    content: [
        {
            type: 'text' as const,
            text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
        },
    ],
});
