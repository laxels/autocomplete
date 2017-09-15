(function() {

  function getRequest(url, cb) {
    var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.addEventListener('load', function() {
      if(cb) cb(req.response);
    });
    req.open('GET', url);
    req.send();
  };


  var defaults = {
    list: [],
    minChars: 2,
    throttle: 300
  };


  var AC = self.Autocomplete = function(element, args) {
    var ac = this;
    ac.element = element;

    for(var d in defaults) ac[d] = defaults[d];

    var acceptedArgs = ['list', 'url', 'urlParams', 'queryParam', 'minChars', 'throttle'];
    for(var i=0; i<acceptedArgs.length; i++) {
      var a = acceptedArgs[i];
      if(args[a] !== undefined) ac[a] = args[a];
    }

    ac.ongoingRequests = {};

    ac.currentValue = ac.element.value;
    ac.element.addEventListener('keydown', function() {
      setTimeout(function() {
        if(ac.element.value == ac.currentValue) return;

        var val = ac.currentValue = ac.element.value;
        if(val.length < ac.minChars) return;

        if(ac.url && ac.queryParam) ac.getListFromUrl(function(){ac.open()});
        else ac.open();
      }, 0);
    });
  };


  AC.prototype.open = function() {
    var ac = this;
    console.log('opening', ac.list);
    if(!ac.list.length) return ac.close();
  };


  AC.prototype.close = function() {
    var ac = this;
    console.log('closing');
  };


  AC.prototype.getListFromUrl = function(cb) {
    var ac = this;
    if(!ac.url) return;

    var url = ac.url + '?'+ac.queryParam+'='+ac.currentValue;

    if(ac.urlParams) {
      for(var p in ac.urlParams) {
        url += p+'='+ac.urlParams[p];
      }
    }

    var ts = ac.ongoingRequests['getListFromUrl'] = Date.now();
    getRequest(url, function(data) {
      if(ts != ac.ongoingRequests['getListFromUrl']) return;
      ac.list = data;
      if(cb) cb();
    });
  };

})();
