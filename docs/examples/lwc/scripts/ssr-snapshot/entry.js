import { renderComponent } from '@lwc/engine-server';
import Hello from 'c/hello';
globalThis.__LWC_MOCKS__ = {
    getAccounts: {
        data: [
            { Id: '1', Name: 'Acme' },
            { Id: '2', Name: '日本商事' },
        ],
    },
};
console.log(renderComponent('c-hello', Hello, { recordId: '001', title: '取引先一覧 (モック)' }));
console.log('---- データなし');
globalThis.__LWC_MOCKS__ = { getAccounts: { data: [] } };
console.log(renderComponent('c-hello', Hello, { recordId: '001' }));
