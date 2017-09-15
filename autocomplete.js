(function() {

  var defaults = {
    list: [],
    minChars: 2,
    throttle: 300
  };


  var AC = self.Autocomplete = function(args) {
    var ac = this;

    for(var d in defaults) ac[d] = defaults[d];

    var acceptedArgs = ['element', 'list', 'url', 'minChars', 'throttle'];
    for(var i=0; i<acceptedArgs.length; i++) {
      var a = acceptedArgs[i];
      if(args[a] !== undefined) ac[a] = args[a];
    }

    if(args.urlParams && ac.url) {
      ac.url += '?';
      for(var p in args.urlParams) {
        ac.url += p+'='+args.urlParams[p];
      }
    }

    ac.ongoingRequests = {};

    ac.currentValue = ac.element.value;
    ac.element.addEventListener('keydown', function() {
      setTimeout(function() {
        if(ac.element.value == ac.currentValue) return;

        var val = ac.currentValue = ac.element.value;
        if(val.length < ac.minChars) return;

        if(ac.url) ac.getListFromUrl(function(){ac.open()});
        else ac.open();
      }, 0);
    });
  };


  AC.prototype.getRequest = function(url, cb) {
    var ac = this;
    var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.addEventListener('load', function() {
      if(cb) cb(req.response);
    });
    req.open('GET', ac.url);
    req.send();
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
    var ts = ac.ongoingRequests['getListFromUrl'] = Date.now();
    ac.getRequest(ac.url, function(data) {
      if(ts != ac.ongoingRequests['getListFromUrl']) return;
      ac.list = data;
      if(cb) cb();
    });
  };

})();
