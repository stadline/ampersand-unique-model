var AmpRegistry = require('ampersand-registry');
var registry = new AmpRegistry();

module.exports = {
    store: function(model) {
        if (model.getType() && model.getId()) {
            return registry.store(model);
        }
    },
    lookup: function(model) {
        return registry.lookup(model.getType(), model.getId(), model.getNamespace());
    },
    remove: function(model) {
        return registry.remove(model.getType(), model.getId(), model.getNamespace());
    },
    clear: function() {
        return registry.clear();
    }
};

