import { JSONUIProvider, Renderer } from '@json-render/react';
import type { Spec } from '@json-render/core';

import { registry } from './registry';

/** HTML に入れる文書 (src/builder/reportBuilder.ts の EmbeddedReport と同じ形) */
export type EmbeddedReport = {
    title: string;
    compared?: string;
    spec: Spec & { state: Record<string, unknown> };
};

/** レポート 1 つ (タイトルと、json-render の仕様を state とともに描く) */
export const ReportView = ({ report }: { report: EmbeddedReport }) => (
    <JSONUIProvider registry={registry} initialState={report.spec.state}>
        <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">{report.title}</h1>
                {report.compared && (
                    <p className="text-muted-foreground text-sm">比べた時点: {report.compared}</p>
                )}
            </header>
            <Renderer spec={report.spec} registry={registry} />
        </main>
    </JSONUIProvider>
);
