var Ajv = require('ajv')

console.log(typeof ace)

var JSONEditor = function (container, schema, data, cbObj) {
  this.rootContainer = container
  this.rootSchema = schema
  //this.rootSchemaAlt = {'#': schema} // hack to acess schema generated by ajv
  this.elementsObj = {}
  this._data = {root: data}
  this.cb = cbObj || {}
  container.innerHTML = '';

  var ajv = new Ajv({allErrors: true})
  this.validateToSchema = ajv.compile(schema)

  this.getData = (p, o, n) => this._data.root

  this.save = () => {
    this.cb.onSave(this._data.root)
  }

  this.redraw = () => {
    iterateLevel(this.rootSchema, this.rootContainer, this._data.root)
    this.validateEditor()
  }

  this.mjp = (p, o, n) => p
    .split(/\.|\[|\]|\//)
    .filter((x) => !!x)
    .reduce((a, c, i, l) => l.length-i <= n ? a : a[c], o)
  ;

  var addClass = function(el, klass) {
    el.className = el.className
      .split(' ')
      .concat(klass)
      .filter((item, pos, self) => !!item.length && self.indexOf(item) === pos)
      .join(' ')
    ;
  }

  var removeArrayItem = (arrayPathWithIndex, parentCtx, deleteCount) => {
    deleteCount = deleteCount || 1
    let arrayPathSplit = arrayPathWithIndex.split('[')
    var itemArrayIndex = parseInt(arrayPathSplit[arrayPathSplit.length-1].replace(']',''))

    var arrayPath = arrayPathWithIndex.split('[').slice(0,-1).join('[')

    var ctxContainer = this.rootContainer.querySelector('[path="'+arrayPathWithIndex+'"]._json-editor')
    
    // remove dom elements
    while (ctxContainer.firstChild) {
      ctxContainer.removeChild(ctxContainer.firstChild)
    }
    ctxContainer.parentNode.removeChild(ctxContainer)
    
    // rebuild index of affected dom elements
    var arrayIndex = itemArrayIndex
    while (true) {
      let nextPath = arrayPath+'['+(arrayIndex+1)+']'
      let actualPath = arrayPath+'['+(arrayIndex)+']'

      let selector = '[path^="'+nextPath+'"]'
      let toReIndex = this.rootContainer.querySelectorAll(selector)
      
      if (toReIndex.length === 0) {
        break
      }

      toReIndex.forEach(element => {
        let oldPath = element.getAttribute('path')
        let newPath = oldPath.replace(nextPath, actualPath)
        element.setAttribute('path', newPath)
        //console.log(oldPath, newPath)
      })

      arrayIndex = arrayIndex+1
    }
    // remove item from data
    parentCtx.splice(itemArrayIndex, deleteCount)
    return
  }

  this.validateEditor = (targetPath) => {
    // trigger validation
    var valid = this.validateToSchema(this._data.root)
    var errors = this.validateToSchema.errors
    errors = errors || [];
    
    // if provided, get only errors for targetPath.
    // this give the possibilite to validate entire 
    // editor or just some parts of it
    if (targetPath) {
      errors = errors.filter((item) => 'root'+item.dataPath === targetPath)
    }

    var pathsWithError = []
    if (!valid) {
      for (var i = 0; i < errors.length; i++) {
        let err = errors[i]
        pathsWithError.push('root'+err.dataPath)        
        var helpEl = this.rootContainer.querySelector('[path="root'+err.dataPath+'"]._json-editor-help')
        if (helpEl) {
          helpEl.innerHTML = err.message
          addClass(helpEl, 'is-danger')
        }
      }
    }

    if (targetPath) {
      pathsWithError = pathsWithError.filter((item) => item === targetPath)
    }

    // clear fixed errors. If `targetPath` is set, check if path 
    // dont have erros and clear it
    if (targetPath) {
      var helpElList = [this.rootContainer.querySelector('[path="'+targetPath+'"]._json-editor-help')]
    } else {
      var helpElList = this.rootContainer.getElementsByClassName('_json-editor-help')
    }
    
    for (var i = helpElList.length - 1; i >= 0; i--) {
      let el = helpElList[i]
      let elPath = el.getAttribute('path')
      if (pathsWithError.indexOf(elPath) === -1) {
        el.innerHTML = ''
      }
    }    
  }

  var iterateLevel = (obj, container, ctx, ctxPath, parentKey, levelNumber, parentCtx, itemArrayIndex)  => {
    var type = obj.type
    ctxPath = ctxPath == undefined ? 'root' : ctxPath
    levelNumber = levelNumber = undefined ? 0 : levelNumber

    var ctxContainer = this.rootContainer.querySelector('[path="'+ctxPath+'"]._json-editor')
    var ctxContainerExists = !!ctxContainer
    if (!ctxContainerExists) {
      ctxContainer = document.createElement('div')
      ctxContainer.className += '_json-editor '
      ctxContainer.setAttribute('path', ctxPath)
    }
    
    if (type === 'object') {
      if (!ctxContainerExists) {
        ctxContainer.className += 'box'
        container.append(ctxContainer)

        //console.log(ctx)
        
        if (obj.title) {
          var objTitleContainerEl = document.createElement('div')
          ctxContainer.append(objTitleContainerEl)
          var objTitleEl = document.createElement('p')
          objTitleEl.className += 'has-text-weight-medium has-text-dark is-size-5'
          objTitleEl.innerHTML = obj.title
          objTitleContainerEl.append(objTitleEl)
        }
        
      }

      Object.keys(obj.properties).map((key) => {
        iterateLevel(obj.properties[key], ctxContainer, ctx[key], ctxPath+'.'+key, key, levelNumber+1, ctx/*parentCtx*/)
      })
    }

    if (type === 'array') {
      if (!ctxContainerExists) {
        container.append(ctxContainer)
        
        if (ctx === undefined) {
          ctx = []
          parentCtx[parentKey] = ctx
        }

        var arrayTitleEl = document.createElement('p')
        arrayTitleEl.className += 'has-text-weight-medium has-text-dark is-size-5'
        var titleStr = obj.title || (parentKey + ' list')
        arrayTitleEl.innerHTML = titleStr
        ctxContainer.append(arrayTitleEl)

        var arrayItensContainerEl = document.createElement('div')
        arrayItensContainerEl.className += 'content'
        ctxContainer.append(arrayItensContainerEl)
                
        var addArrayItemA = document.createElement('a')
        addArrayItemA.innerHTML = 'Add to ' + titleStr
        addArrayItemA.className += 'button is-primary is-small'
        ctxContainer.append(addArrayItemA)
        addArrayItemA.addEventListener('click', (evt) => {
          if (obj.items.type === 'object') {
            var newCtx = new Object()
          }
          if (obj.items.type === 'array') {
            var newCtx = []
          }
          if (obj.items.type === 'string') {
            var newCtx = ''
          }
          ctx.push(newCtx)
          iterateLevel(this.rootSchema, this.rootContainer, this._data.root)
        })
      } else {
        var arrayItensContainerEl = ctxContainer.getElementsByClassName('content')[0]
        // console.log(ctx.length, ctxPath)
        // remove orphan elements.
        // This can occour when an array item is removed  externaly 
        for (var i = ctx.length; true; i++) {
          var orphanElement = arrayItensContainerEl.querySelector('[path="'+ctxPath+'['+i+']"]')
          if (!orphanElement) break
          //console.log('remove orphan', orphanElement)
          arrayItensContainerEl.removeChild(orphanElement)
        }
      }

      if (ctx) {
        for (var i = 0; i < ctx.length; i++) {
          let arrayPathWithIndex = ctxPath+'['+i+']'
          let arrayItemCtxContainer = iterateLevel(obj.items, arrayItensContainerEl, ctx[i], arrayPathWithIndex, parentKey, levelNumber+1, ctx/*parentCtx*/, i/*itemArrayIndex*/)

          //var deleteArrayItemEl = arrayItemCtxContainer.querySelectorAll('[path="'+arrayPathWithIndex+'"]')[0]
          var deleteArrayItemEl = arrayItemCtxContainer.querySelectorAll('[path="'+arrayPathWithIndex+'"]')[0]
          if (!deleteArrayItemEl) {
            var deleteArrayItemEl = document.createElement('button')
            deleteArrayItemEl.setAttribute('path', arrayPathWithIndex)
            //deleteArrayItemEl.setAttribute('index', i)
            deleteArrayItemEl.addEventListener('click', (evt) => {
              var arrayPathWithIndex = evt.target.getAttribute('path')
              //var itemArrayIndex = evt.target.getAttribute('index')
              removeArrayItem(arrayPathWithIndex, ctx)
            })
            deleteArrayItemEl.className += '_json-editor-delete delete'
            arrayItemCtxContainer.append(deleteArrayItemEl)
            arrayItemCtxContainer.className += ' notification is-white'
          }
        }
      }
    }

    if (type === 'string' || type === 'integer' || type === 'enum') {
      if (!ctxContainerExists) {
        ctxContainer.className += 'field'
        container.append(ctxContainer)

        if (ctx === undefined) {
          // TODO: check for default value and format
          if (obj.type === 'string') {
            parentCtx[parentKey] = ''
          } else if (obj.type === 'integer') {
            parentCtx[parentKey] = 0
          }
        }

        var labelEl = document.createElement('label')
        labelEl.className += 'label has-text-grey-dark is-size-6'
        labelEl.innerHTML = obj.description || parentKey
        
        if (false) { // to right align label to multi colum corm. TODO: enable this feature
          var ctxContainerFieldLabel = document.createElement('div')
          ctxContainerFieldLabel.className += 'field-label'
          ctxContainer.append(ctxContainerFieldLabel)
          ctxContainerFieldLabel.append(labelEl)
        } else {
          ctxContainer.append(labelEl)
        }

        var inputElHolder = document.createElement('div')
        // enum
        if (obj.enum) {
          inputElHolder.className += 'select'

          var inputEl = document.createElement('select')
          
          for (var i = 0; i < obj.enum.length; i++) {
            obj.enum[i]
            var option = document.createElement('option')
            option.value = obj.enum[i]
            option.value = obj.enum[i]
            option.text = obj.enum[i]
            inputEl.appendChild(option)
          }
        // other input
        } else {

          // text can have multiple formats
          if (obj.options && obj.options.format === 'code') {
            var inputEl = document.createElement('textarea');
            inputEl.setAttribute('rows', 30);
            inputEl.setAttribute('cols', 30);
            inputEl.setAttribute('spellcheck', false);
            
            inputEl.style.height = '300px';
            inputEl.style['font-family'] = 'monospace';
            inputEl.style.background = 'black';
            inputEl.style.color = 'white';

            inputEl.onkeydown = function (e){
              if(e.key === 'Tab') {
                e.preventDefault();
                const TAB_SIZE = 2;

                // unident tab 
                if (e.shiftKey) {
                  // unident is possible only when not selecting a range
                  if (e.target.selectionStart ===  e.target.selectionEnd) {
                    var selection = e.target.selectionStart;
                    // to find selected line
                    var lines = e.target.value.replace(/\n/g, ' \n').split('\n');
                    var charCount = 0;
                    for (var i = 0; i < lines.length; i++) {
                      charCount += lines[i].length;
                      if (charCount > selection) {
                        let colPosition = selection - charCount + lines[i].length;
                        
                        // remove if exists spaces on the left of cursos
                        let contentOnLeftOfCursor = lines[i].slice(0, colPosition);
                        if (colPosition > 0 && contentOnLeftOfCursor.trim() === '') {
                          let spacesRemoved = 1;
                          // remove one space
                          lines[i] = lines[i].replace(' ', '');
                          // if left content have more than one space, remove another
                          if (contentOnLeftOfCursor.length > 1) {
                            lines[i] = lines[i].replace(' ', '');
                            spacesRemoved += 1;
                          }
                          e.target.value = lines.map((line) => line.slice(0, -1)).join('\n');
                          e.target.setSelectionRange(selection - spacesRemoved, selection - spacesRemoved); 
                          
                        }
                        break
                      }
                      
                    }
                  }
                } else {
                  // https://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea
                  document.execCommand('insertText', false, ' '.repeat(TAB_SIZE));
                }
              }
            }


          } else {
            var inputEl = document.createElement('input')
          }
          if (obj.type === 'integer') {
            inputEl.setAttribute('type', 'number')
            inputEl.setAttribute('step', '1')
          } else {

            inputEl.setAttribute('type', 'text')

          }
          inputEl.className += 'input'
        }
        
        inputElHolder.append(inputEl)
        
        var controlEl = document.createElement('p');
        controlEl.className += 'control is-expanded'
        controlEl.append(inputElHolder)

        var ctxContainerFieldBodyField = document.createElement('div')
        ctxContainerFieldBodyField.className += 'field'
        ctxContainerFieldBodyField.append(controlEl)
        var ctxContainerFieldBody = document.createElement('div')
        ctxContainerFieldBody.className += 'field-body'
        ctxContainerFieldBody.append(ctxContainerFieldBodyField)
        ctxContainer.append(ctxContainerFieldBody)

        var ctxContainerFieldBodyFieldHelp = document.createElement('p')
        ctxContainerFieldBodyField.append(ctxContainerFieldBodyFieldHelp)

        ctxContainerFieldBodyFieldHelp.className += '_json-editor-help help'
        ctxContainerFieldBodyFieldHelp.setAttribute('path', ctxPath)
        
        var events = ['change', 'keyup']
        for (let i = 0; i < events.length; i++) {
          var event = events[i];

          ctxContainerFieldBodyField.addEventListener(event, (evt) => {
            var path = evt.target.getAttribute('path')
            
            // get el value
            if (evt.target.nodeName === 'SELECT') {
              var elValue = evt.target.selectedOptions[0].value
            } else {
              var elValue = evt.target.value
            }

            var res = this.mjp(path, this._data, 1)

            // set data value
            if (typeof(res) === 'object') {
              let key = evt.target.getAttribute('key')
              if (obj.type === 'integer') {
                res[key] = parseInt(elValue)
              } else if (obj.type === 'number') {
                res[key] = parseFloat(elValue)
              } else {
                res[key] = elValue
              }

            }

            this.validateEditor(path)

            if (this.cb.onChange) {
              this.cb.onChange(evt)
            }

          })
        }
      } else {
        var inputEl
        var isSelect = false
        // get input element, that can be a input or select
        inputEl = ctxContainer.getElementsByTagName('input')[0]
        if (!inputEl) {
          inputEl = ctxContainer.getElementsByTagName('select')[0]
        }
      }

      //console.log(ctxPath, inputEl)
      inputEl.setAttribute('path', ctxPath)
      inputEl.setAttribute('key', parentKey)
      
      if (inputEl.nodeName === 'SELECT') {
        if (!ctx) {
          var optionDefault = document.createElement('option');
          optionDefault.text = 'choose one...';
          optionDefault.setAttribute('value', '');
          optionDefault.setAttribute('selected', '');
          optionDefault.setAttribute('disabled', '');
          optionDefault.setAttribute('hidden', '');
          inputEl.appendChild(optionDefault);
        } else {
          inputEl.value = ctx;
        }
        // //inputEl.value = obj.enum[0]
        // // passing, so first item will be selected nativelly
      } else {
        if (['number', 'integer'].indexOf(type) !== -1) {
          inputEl.value = ctx || null;
        } else {
          inputEl.value = ctx || obj.default || '';
        }
      }

      /*if (itemArrayIndex !== undefined) {
        inputEl.setAttribute('index', itemArrayIndex)
      }*/
    }
    return ctxContainer
  }
  iterateLevel(schema, container, data)
  var saveJsonEl = document.createElement('a')
  saveJsonEl.innerHTML = 'Save'
  saveJsonEl.className += 'button is-link'
  container.append(saveJsonEl)
  saveJsonEl.addEventListener('click', () => {
    if (this.cb.onSave) {
      this.cb.onSave(this._data.root)
    }
  })
}

export default JSONEditor