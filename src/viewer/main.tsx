import React from 'react';
import ReactDOM from 'react-dom/client';

import { Prop } from './types';
import { layout as MetadataLayout } from './metadata';

// グローバル型の定義
declare global {
    interface Window {
        __METASCOPE_METADATA_DEFINE__?: Prop;
    }
}

const rootElement = document.getElementById('root');

if (rootElement) {
    const metadata = window.__METASCOPE_METADATA_DEFINE__;

    if (metadata && metadata.type === 'metadata') {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <MetadataLayout metadata={metadata.metadata} dependency={metadata.dependency} />
            </React.StrictMode>,
        );
    } else {
        ReactDOM.createRoot(rootElement).render(
            <div style={{ padding: 20 }}>No Metadata Provided</div>,
        );
    }
}
