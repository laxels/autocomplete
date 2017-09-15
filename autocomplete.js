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

    ac.listElement = document.createElement('div');
    ac.listElement.classList.add('autocomplete-list');
    ac.element.parentElement.insertBefore(ac.listElement, ac.element.nextSibling);

    Object.defineProperty(ac, 'list', {
      get: function() {
        return ac._list;
      },
      set: function(l) {
        ac._list = l;
        ac.refreshList();
      }
    });

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
        if(val.length < ac.minChars) return ac.close();

        if(ac.url && ac.queryParam) ac.getListFromUrl(function(){ac.open()});
        else ac.open();
      }, 0);
    });
  };


  AC.prototype.refreshList = function() {
    var ac = this;
    ac.listElement.innerHTML = '';
    for(var i=0; i<ac.list.length; i++) {
      (function(x) {
        var e = document.createElement('div');
        e.classList.add('autocomplete-list-item');
        e.textContent = x.name;
        e.addEventListener('click', function() {
          ac.select(x);
        });
        ac.listElement.appendChild(e);
      })(ac.list[i]);
    }
  };


  AC.prototype.open = function() {
    var ac = this;
    console.log('opening', ac.list);
    if(!ac.list.length) return ac.close();
    ac.listElement.style.display = 'block';
  };


  AC.prototype.close = function() {
    var ac = this;
    console.log('closing');
    ac.listElement.style.display = 'none';
  };


  AC.prototype.select = function(item) {
    var ac = this;
    console.log('selecting', item);
    ac.close();
    ac.currentValue = ac.element.value = item.name;
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
