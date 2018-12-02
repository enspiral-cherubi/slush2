var $ = require('jquery')
var deferred = $.Deferred()

module.exports = function (audioCtx) {

  function getMic () {
    // taken from https://www.airtightinteractive.com/demos/js/pareidolia/
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  	if (navigator.getUserMedia) {
  		navigator.getUserMedia({audio: true}, onSuccess, onError)
  	} else {
      deferred.reject('no user media')
  	}

    return deferred.promise()
  }

  function onSuccess (stream) {
    var microphone = audioCtx.createMediaStreamSource(stream)
    deferred.resolve(microphone)
  }

  function onError (err) {
    deferred.reject(err)
  }

  return getMic
}
