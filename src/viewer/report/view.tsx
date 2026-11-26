import { JSONUIProvider, Renderer } from '@json-render/react';
import type { EmbeddedReport } from '../../report/embedding';

import { registry } from './registry';

/** HTML に入れる文書 (型はビルドと共通。src/report/embedding.ts) */
export type { EmbeddedReport };

/** レポート 1 つ (タイトルと、json-render の仕様を state とともに描く) */
export const ReportView = ({ report }: { report: EmbeddedReport }) => (
    <JSONUIProvider registry={registry} initialState={report.spec.state}>
        <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
            <header className="flex flex-col gap-1">
                {report.parent && (
                    <a
                        href={report.parent.href}
                        className="text-muted-foreground w-fit text-sm underline-offset-2 hover:underline"
                    >
                        {`← ${report.parent.title}`}
                    </a>
                )}
                <h1 className="text-2xl font-semibold">{report.title}</h1>
                {report.compared && (
                    <p className="text-muted-foreground text-sm">比べた時点: {report.compared}</p>
                )}
            </header>
            <Renderer spec={report.spec} registry={registry} />
        </main>
    </JSONUIProvider>
);
