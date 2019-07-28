//x = _.chain([1,2,3,4,5]).filter((x) => x < 5).groupBy((x) => x%2).value()
//_.log(_.isArray({}))

export default new (function() {
  this._value = undefined  
  this._getArgs = (...args) => {
    var val, fn
    if (this._value !== undefined) {
      val = this._value
      fn = args[0]
    } else {
      val = args[0]
      fn = args[1]
    }
    return {val: val, fn: fn}
  }

  this._return = (res) => {
    if (this._value !== undefined) {
      this._value = res
      return this
    } else {
      return res
    }
  }
  
  //https://github.com/makeable/uuid-v4.js/blob/master/uuid-v4.js
  this._dec2hex = []
  for (let i=0; i<=15; i++) {this._dec2hex[i] = i.toString(16)}
  this.UUID = () => {
    var res = ''
    for (var i=1; i<=36; i++) {
      if (i===9 || i===14 || i===19 || i===24) {
        res += '-'
      } else if (i===15) {
        res += 4
      } else if (i===20) {
        res += this._dec2hex[(Math.random()*4|0 + 8)]
      } else {
        res += this._dec2hex[(Math.random()*16|0)]
      }
    }
    return this._return(res)
  }

  this.clone = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    return this._return(JSON.parse(JSON.stringify(argsMap.val)))
  }

  this._logEnabled = true
  this.log = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    if (this._logEnabled) {
      console.log.apply(undefined, args)
    }
    return this._return(argsMap.val)
  }

  this.groupBy = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    var res = argsMap.val.reduce((acc, curr, i, arr) => {
      let r = argsMap.fn(curr, i, arr)
      if(!acc[r]){
        acc[r] = []
      }
      acc[r].push(curr)
      return acc
    }, {})
    return this._return(res)
  }

  this.isArray = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    var res = Array.isArray(argsMap.val)
    return this._return(res)
  }

  this.capitalize = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    var val = argsMap.val.toString()
    var res = val.slice(0,1).toUpperCase()+val.slice(1)
    return this._return(res)
  }

  this.last = (...args) => {
    var argsMap = this._getArgs.apply(undefined, args)
    var res = argsMap.val.slice(-1)[0]
    return this._return(res)
  }

  // start chain
  this.chain = (arg) => {
    this._value = arg
    return this
  }

  // end chain
  this.value = () => {
    var res = this._value
    this._value = undefined
    return res
  }

  // enable chaining native functions
  ['map', 'filter', 'reduce', 'split', 'replace'].map((fnName) => {
    this[fnName] = (...args) => {
      if (this._value === undefined) {
        console.error('Method only avaliable for chaining.')
        return
      }
      var res = this._value[fnName](...args)
      this._value = res
      return this
    }
  })
})
