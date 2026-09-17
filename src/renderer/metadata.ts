import fs 

import {
    MetadataObjectDiff,
    MetadataObject,
    MetadataFieldDiff,
    MetadataField,
} from '../types/metadata';
import { Dependency, DependencyDiff } from '../types/metadata';


export class MetadataRenderer {
    private saveDir:string = '';

    constructor(saveRoot:string) {

    }
}

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const escapeMermaid = (value: string): string =>
    value.replace(/(["`\\])/g, '\\$1').replace(/[\r\n]+/g, ' ');

const getStatusClass = (status: string): string => status.toLowerCase();

const createDependencyGraph = (metadataObjectDiffs: MetadataObjectDiff[]): string => {
    const nodes = new Set<string>();
    const edges = new Set<string>();

    metadataObjectDiffs.forEach((objectDiff) => {
        nodes.add(objectDiff.apiName);
        objectDiff.fields.forEach((fieldDiff) => {
            if (!fieldDiff.referenceObjectApiName) {
                return;
            }

            nodes.add(fieldDiff.referenceObjectApiName);
            const edge = `    ${objectDiff.apiName} -->|${fieldDiff.apiName}| ${fieldDiff.referenceObjectApiName}`;
            edges.add(edge);
        });
    });

    if (edges.size === 0) {
        return 'flowchart LR\n    empty[参照依存関係なし]';
    }

    const nodeLines = [...nodes].map((node) => `    ${node}["${escapeMermaid(node)}"]`);

    return ['flowchart LR', ...nodeLines, ...edges].join('\n');
};

const createDiffRows = (metadataObjectDiffs: MetadataObjectDiff[]): string =>
    metadataObjectDiffs
        .flatMap((objectDiff) =>
            objectDiff.fields.map(
                (fieldDiff) => `
        <tr>
            <td>${escapeHtml(objectDiff.apiName)}</td>
            <td>${escapeHtml(fieldDiff.apiName)}</td>
            <td><span class="status ${getStatusClass(fieldDiff.status)}">${escapeHtml(fieldDiff.status)}</span></td>
            <td>${escapeHtml(fieldDiff.type)}</td>
            <td>${escapeHtml(fieldDiff.referenceObjectApiName ?? '-')}</td>
        </tr>`,
            ),
        )
        .join('');

export const renderMetadataResult = (metadataObjectDiffs: MetadataObjectDiff[]): string => {
    const graph = createDependencyGraph(metadataObjectDiffs);
    const rows = createDiffRows(metadataObjectDiffs);

    return `<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Metadata Analyzer</title>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true, securityLevel: 'strict', theme: 'neutral' });
    </script>
    <style>
        :root { color-scheme: light; font-family: sans-serif; }
        body { margin: 0; background: #f4f6f8; color: #17202a; }
        main { max-width: 1200px; margin: 0 auto; padding: 32px 20px 48px; }
        h1 { margin: 0 0 24px; font-size: 28px; }
        section { margin-top: 24px; padding: 20px; background: #fff; border: 1px solid #dce1e6; border-radius: 8px; }
        h2 { margin: 0 0 16px; font-size: 20px; }
        .mermaid { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e7eaee; }
        th { background: #f8f9fa; font-weight: 600; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .new { color: #075e2c; background: #d9f7e5; }
        .exist { color: #39536b; background: #e3edf5; }
        .delete { color: #8b1e1e; background: #fde2e2; }
        @media (max-width: 700px) { main { padding: 20px 12px 32px; } section { padding: 14px; } table { font-size: 13px; } }
    </style>
</head>
<body>
    <main>
        <h1>Metadata Analyzer</h1>
        <section>
            <h2>依存関係</h2>
            <div class="mermaid">${escapeHtml(graph)}</div>
        </section>
        <section>
            <h2>メタデータ差分</h2>
            <table>
                <thead><tr><th>オブジェクト</th><th>フィールド</th><th>状態</th><th>型</th><th>参照先</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5">差分なし</td></tr>'}</tbody>
            </table>
        </section>
    </main>
</body>
</html>`;
};
