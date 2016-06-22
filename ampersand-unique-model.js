var AmpModel = require('ampersand-model');
var registry = require('./ampersand-unique-registry');

module.exports = AmpModel.extend({
    constructor: function() {
        AmpModel.prototype.constructor.apply(this, arguments);

        this.listenTo(this, 'change:'+this.idAttribute, this._setSource);
        this.listenTo(this, 'change:'+this.typeAttribute, this._setSource);
        this.listenTo(this, 'change:'+this.namespaceAttribute, this._setSource);

        this._setSource();
        this.listenToAndRun(this, 'change', this._onLocalChange);

        this.listenTo(this, 'destroy', this._onLocalDestroy);
    },
    _source: null,
    _setSource: function() {
        // detach listeners
        if (this._source) {
            this.stopListening(this._source);
        }

        // update source
        registry.store(this);
        this._source = registry.lookup(this);

        // attach listeners
        if (this._source) {
            this.listenToAndRun(this._source, 'change', this._onSourceChange);
        }
    },
    _onLocalChange: function() {
        if (this._source) {
            var localAttrs = this.getAttributes({props: true, session: true});

            this._source.set(localAttrs);
        }
    },
    _onSourceChange: function() {
        if (this._source) {
            var sourceAttrs = this._source.getAttributes({props: true, session: true});

            this.set(sourceAttrs);
        }
    },
    _onLocalDestroy: function() {
        if (this._source) {
            this._source.clear();
        }
    }
});