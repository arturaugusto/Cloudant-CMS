var _ = require('./src/t').default;window._ = _;
var page = require('page');window.page = page;
var JSONEditorHandler = require('./src/JSONEditor-handler.js').default;
var schemas = require('./src/schemas').default;
var patcheDocData = require('./src/patcheDocData').default;
var db = require('./src/db').default;

window._STATE = {
  db: db,
  editor: undefined,
  docBase: undefined,
  patchesApplied: {}
};

window._STATE.db.changes({
  //since: 'now',
  live: true,
  include_docs: true
}).on('change', function(change) {
  var id = _.chain(window.location.hash).split('/').last().value().trim();
  // If change has id of current editor, update editor data
  if (change.id.split('_')[1] === id && window._STATE.docBase) {
    window._STATE.docBase._rev = change.doc._rev
    var newPatches = change.doc.patches;
    patcheDocData(window._STATE.editor._data.root, newPatches, window._STATE.patchesApplied)
    window._STATE.editor.redraw()
  }
}).on('complete', function(info) {
  console.log(info)
  // changes() was canceled
}).on('error', function (err) {
  console.log(err)
});


var panelsContainer = document.getElementById('panels-container');
var jsonEditorContainer = document.getElementById('json-editor-container');

page.configure({window: window, hashbang: true});
// configure routes based on schemas
Object.keys(schemas).map((schemaName) => {
  page('/'+schemaName+'/:id', (ctx, next) => {
    window._STATE.patchesApplied = {};
    panelsContainer.style.display = 'none';
    jsonEditorContainer.style.display = '';
    jsonEditorContainer.innerHTML = '';

    var id = ctx.params.id;
    JSONEditorHandler(id, jsonEditorContainer, schemaName);
    //next()
  });

});


page('/', (ctx, next) => {
  panelsContainer.style.display = '';
  panelsContainer.innerHTML = '';
  jsonEditorContainer.style.display = 'none';
  window._STATE.editor = undefined;
  window._STATE.docBase = undefined;

  Object.keys(schemas).map((schemaName) => {
    var schema = schemas[schemaName];
    var schemaCurrent = schema[schema.length-1];
    db.allDocs({
      include_docs: true,
      attachments: false,
      startkey: schemaName+'_',
      endkey: schemaName+'_\ufff0'
    }).then(function (result) {

      var cardTemplate = `<div class="card">
        <header class="card-header">
          <p class="card-header-title">
          </p>
          <a href="#" class="card-header-icon" aria-label="more options">
            <span class="icon">
              <i class="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </a>
        </header>
        <div class="card-content">
          <div class="content">
          </div>
        </div>
        <footer class="card-footer">
        </footer>
      </div>`;


      // create base column and table
      var columnEl = document.createElement('div');
      columnEl.className += 'column';
      columnEl.innerHTML = cardTemplate;    
      panelsContainer.append(columnEl);
      
      var cardContentEl = columnEl.getElementsByClassName('content')[0]

      // set table row data
      var schemaProps = schemaCurrent.schema.properties;
      
      // header title
      var cardHeaderTitleEl = columnEl.getElementsByClassName('card-header-title')[0];
      cardHeaderTitleEl.innerText = _.capitalize(schemaName) + ' list'


      // get ant patche docs
      if (!result.rows.length) {
        var nodataDiv = document.createElement('div');
        nodataDiv.innerText = 'No data.';
        nodataDiv.className += 'is-size-6 ';
        cardContentEl.append(nodataDiv);
      } else {

        // create table and its base elements
        var tableEl = document.createElement('table');
        tableEl.className += 'table is-striped is-hoverable is-fullwidth';

        cardContentEl.append(tableEl);
        
        var theadEl = document.createElement('thead');
        tableEl.append(theadEl);
        
        var headTrEl = document.createElement('tr');
        theadEl.append(headTrEl);

        var tbodyEl = document.createElement('tbody');
        tableEl.append(tbodyEl);

        var tableColsNames = Object.keys(schemaProps)
          .filter((item) => ['array', 'object'].indexOf(schemaProps[item].type) === -1 )
        ;

        tableColsNames.map((key) => {
          var thEl = document.createElement('th');
          thEl.innerText = key;
          headTrEl.append(thEl);
        });

        result.rows.map((item, i) => {
          patcheDocData(item.doc.iniData, item.doc.patches)
          var data = item.doc.iniData;
          var tbodyTrEl = document.createElement('tr');
          tbodyEl.append(tbodyTrEl);
          tbodyTrEl.addEventListener('click', (evt) => {
            page('/'+schemaName+'/'+item.doc._id.split('_')[1]);
          });

          tableColsNames.map((colName) => {
            var tdEl = document.createElement('td');
            tdEl.innerText = data[colName];
            tbodyTrEl.append(tdEl);
          });
        });
      }

      // footer
      var cardFooter = columnEl.getElementsByTagName('footer')[0];
      var newItemAEl = document.createElement('a');
      newItemAEl.className += 'card-footer-item';
      newItemAEl.innerText = '+ new ' + (schemaCurrent['title'] || schemaName);
      cardFooter.append(newItemAEl)

      newItemAEl.addEventListener('click', (e) => {
        page('/'+schemaName+'/new');
        e.preventDefault();
      })

    }).catch(function (err) {
      console.log(err);
    });
    
  });
});

// route to page based on current URL
page(window.location.hash.replace('#!',''));

page('//*/*', (ctx) => {
  var params = {schema: ctx.params[0], id: ctx.params[1]}
  console.warn('not found', params);
  page('/');
})

