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
    if(this._handlerGroups.length > 0) this._callHandlers();
  }

}

$Promise.prototype._internalReject = function(reason) {
  if( this._state === 'pending' ){
    this._value = reason;
    this._state = 'rejected';
  }
}

$Promise.prototype._callHandlers = function(obj){
  var len = this._handlerGroups.length;
  // console.log(this._handlerGroups)
  // console.log('........',len)
  if(obj){
    if( len > 0 ){
      this._handlerGroups[len - 1].downstreamPromise = obj.successCb
      //obj.downstreamPromise = this._handlerGroups[len - 1].successCb;
      this._handlerGroups[ len ] = obj;
      len++;
    }else{
      this._handlerGroups.push( obj );
      len++;
    // console.log('len after push...',this._handlerGroups)
    }
    if(this._state === 'fulfilled' && len === 1){
      //console.log('.........', this._handlerGroups, this._value)
      this._handlerGroups[0].successCb(this._value)
    }else if( this._state === 'fulfilled' && len > 1){
      console.log('......;len >1', this._handlerGroups, this._value)
      this._handlerGroups.slice(len-2,-1).forEach( group => {
        //group.successCb();
        group.downstreamPromise(this._value)
      })
    }
  }else{
    this._handlerGroups[0].successCb(this._value)

    this._handlerGroups.forEach( group => {
      if(typeof(group.downstreamPromise) === 'function'){
        group.downstreamPromise(this._value)
      }
    })
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
  var obj = { successCb: successVal, errorCb: failVal, downstreamPromise: null }
  this._callHandlers(obj);
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
