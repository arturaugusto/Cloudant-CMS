var _ = require('./t').default
var rfc6902 = require('rfc6902')
var JSONEditor = require('./JSONEditor.js').default
var patcheDocData = require('./patcheDocData').default
var schemas = require('./schemas').default

export default (function(id, container, type) {
  var schemaHistory = schemas[type]
  var timestamp = Date.now()
  var prevData, docBase
  
  var mountEditor = (data) => {
    var schema = schemaHistory[docBase.schemaVersion].schema

    window._STATE.editor = new JSONEditor(container, schema, data)
    prevData = _.clone(window._STATE.editor.getData())
    patcheDocData(window._STATE.editor._data.root, docBase.patches, window._STATE.patchesApplied)
    //window._STATE.editor.redraw()

    window._STATE.editor.cb.onSave = (newData) => {
      var patch = rfc6902.createPatch(prevData, newData)
      if (!patch.length) return;

      if (!docBase.iniData) {
        docBase.iniData = newData;
      } else {
        let patchApplied = {p: patch, t: Date.now()};
        window._STATE.patchesApplied[patchApplied.t] = patchApplied;
        docBase.patches.push(patchApplied);
      }

      prevData = _.clone(newData);

      // save the doc
      window._STATE.db.put(docBase).then((res) => {
        docBase._rev = res.rev;

        // if its a new doc, replace the url to
        // /:schema/:id
        if (id === 'new') {
          page.redirect('/'+res.id.replace(/_([^_]*)$/,'\/$1'));
        }

      }).catch((err) => {
        _.log(err);
      })
    }
  }
  //console.log(id)
  window._STATE.db.get(type+'_'+id, {conflicts: true}).then((doc) => {
    //_.log('get existing doc', doc)
    docBase = doc;
  }).catch((err) => {
    docBase = {
      iniData: undefined,
      _id: type+'_'+(new Date().toISOString()),
      type: type,
      patches: [],
      t: timestamp,
      schemaVersion: schemaHistory.length-1
    }
  }).finally((_res) => {
    window._STATE.docBase = docBase;
    var editorIniData = _.clone(docBase.iniData || {});
    patcheDocData(editorIniData, docBase.patches, window._STATE.patchesApplied);
    mountEditor(editorIniData);
    if (id !== 'new') {
      window._STATE.editor.validateEditor();
    }
  })  
})
