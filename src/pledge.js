'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js ES6-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise(executor){
  if( typeof(executor) !== 'function' ){
    throw new TypeError('executor argument is not a function')
  }

  this._state = 'pending'
  this._value;
  this._handlerGroups = [];

  var that = this;
  var resolve = function(data){
    return that._internalResolve(data);
  }
  var reject = function(reason){
    return that._internalReject(reason);
  }

  executor(resolve, reject)

}

$Promise.prototype._internalResolve = function(data) {

  if(this._state === 'pending'){
    this._value = data;
    this._state = 'fulfilled';

    if(this._handlerGroups.length > 0) {
      this._callHandlers();
      this._handlerGroups = [];
    }
  }
}

$Promise.prototype._internalReject = function(reason) {
  if( this._state === 'pending' ){
    this._value = reason;
    this._state = 'rejected';

    if(this._handlerGroups.length > 0) {
      this._callHandlers();
      this._handlerGroups = [];
    }
  }
}

$Promise.prototype._callHandlers = function(obj){
  var len = this._handlerGroups.length;

  if(obj){
    this._handlerGroups.push( obj )
    len++;
  }

  if(this._state === 'fulfilled' && obj ){
    if( obj.successCb ){
      try{
        this._handlerGroups[len - 1].successCb(this._value)
      }
      catch(e){
        this._handlerGroups[0].downstreamPromise._internalReject(this._value)
      }
    }
  }else if( this._state === 'fulfilled' && !obj ){
    this._handlerGroups.forEach( group => {
      if( group.successCb ){
        try{ var resolvedValue = group.successCb(this._value); }
        catch(e){
          group.downstreamPromise._internalReject(e);
        }

        if( typeof( resolvedValue ) === 'object' ){
          var returnedPromise = resolvedValue;
          returnedPromise.then( (val) => {
            group.downstreamPromise._internalResolve(val)
          } )
          .catch( err => {
            group.downstreamPromise._internalReject( err )
           })

        }else{
          group.downstreamPromise._internalResolve(resolvedValue);
        }
      }else{
        group.downstreamPromise._internalResolve(this._value);
      }
    })
  }else if( this._state === 'fulfilled' ){
    this._handlerGroups[0].downstreamPromise._internalResolve(this._value)
  }


  if(this._state === 'rejected' && obj ){
    if( obj.errorCb )
      this._handlerGroups[len - 1].errorCb(this._value)
  }else if( this._state === 'rejected' && !obj ){
    this._handlerGroups.forEach( group => {

      if( group.errorCb ){
        try{ var resolvedError = group.errorCb(this._value); }
        catch(e){
          console.log('............')
          group.downstreamPromise._internalReject(e);
        }

        if( typeof(resolvedError) === 'object' && typeof( resolvedError ) !== 'string' ) {
          var returnedPromise = resolvedError;
          returnedPromise.then( val => {
            group.downstreamPromise._internalResolve( val )
          })
          .catch( err => group.downstreamPromise._internalReject(err) )

        }else{
          group.downstreamPromise._internalResolve(resolvedError);
        }
      }else{
        group.downstreamPromise._internalReject(this._value);
      }
    })
  }else if( this._state === 'rejecteded' ){
    this._handlerGroups[0].downstreamPromise._internalReject(this._value)
  }
}

$Promise.prototype.then = function(success, fail){
  var successVal = null;
  var failVal = null;

  if( typeof(success) === 'function'){
    successVal = success;
  }

  if( typeof(fail) === 'function'){
    failVal = fail
  }


  var obj = { successCb: successVal, errorCb: failVal,downstreamPromise: new $Promise(function() {}) }

  this._callHandlers(obj);
  return obj.downstreamPromise;
}

$Promise.prototype.catch = function(err){
  return this.then(null, err)
}




/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = $Promise;

So in a Node-based project we could write things like this:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/
