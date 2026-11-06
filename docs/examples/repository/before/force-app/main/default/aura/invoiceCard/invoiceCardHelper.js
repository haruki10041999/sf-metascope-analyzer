({
    load: function (component) {
        const action = component.get('c.getInvoice');
        $A.enqueueAction(action);
    }
});
