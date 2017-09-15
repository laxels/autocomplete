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
    ac.listElement.classList.add('autocomplete-hidden');
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

    var extendArgs = ['list', 'url', 'urlParams', 'queryParam', 'minChars', 'throttle'];
    for(var i=0; i<extendArgs.length; i++) {
      var a = extendArgs[i];
      if(args[a] !== undefined) ac[a] = args[a];
    }

    ac.currentValue = ac.element.value;
    ac.element.addEventListener('keydown', function(e) {
      switch(e.key) {
        case 'ArrowDown':
          ac.hoverDown();
          return e.preventDefault();
        case 'ArrowUp':
          ac.hoverUp();
          return e.preventDefault();
        case 'Enter':
          if(ac.hovered) {
            ac.select(ac.hovered);
            return e.preventDefault();
          }
      }
      setTimeout(function() {
        if(ac.element.value == ac.currentValue) return;

        var val = ac.currentValue = ac.element.value;
        if(val.length < ac.minChars) return ac.close();

        if(ac.url && ac.queryParam) ac.getListFromUrl(function(){ac.open()});
        else ac.open();
      }, 0);
    });

    ac.ongoingRequests = {};
  };


  AC.prototype.refreshList = function() {
    var ac = this;
    ac.listElement.innerHTML = '';
    for(var i=0; i<ac.list.length; i++) {
      (function(x) {
        var e = document.createElement('div');
        e.classList.add('autocomplete-list-item');
        e.textContent = x.name;
        e.addEventListener('click', function(){ac.select(x)});
        e.addEventListener('mouseenter', function(){ac.hover(x)});
        ac.listElement.appendChild(e);
      })(ac.list[i]);
    }
  };


  AC.prototype.refreshHovered = function() {
    var ac = this;
    var index = ac.list.indexOf(ac.hovered);
    for(var i=0; i<ac.list.length; i++) {
      if(i === index) ac.listElement.childNodes[i].classList.add('autocomplete-hovered');
      else ac.listElement.childNodes[i].classList.remove('autocomplete-hovered');
    }
  };


  AC.prototype.open = function() {
    var ac = this;
    if(!ac.list.length) return ac.close();
    ac.listElement.classList.remove('autocomplete-hidden');
  };


  AC.prototype.close = function() {
    var ac = this;
    ac.listElement.classList.add('autocomplete-hidden');
    delete ac.hovered;
    ac.refreshHovered();
  };


  AC.prototype.hover = function(item) {
    var ac = this;
    ac.hovered = item;
    ac.refreshHovered();
  };


  AC.prototype.hoverDown = function() {
    var ac = this;
    if(!ac.list.length) return;
    if(!ac.hovered) var i = 0;
    else {
      var i = ac.list.indexOf(ac.hovered) + 1;
      if(i >= ac.list.length) i = 0;
    }
    ac.hover(ac.list[i]);
  };


  AC.prototype.hoverUp = function() {
    var ac = this;
    if(!ac.list.length) return;
    if(!ac.hovered) var i = ac.list.length - 1;
    else {
      var i = ac.list.indexOf(ac.hovered) - 1;
      if(i < 0) i = ac.list.length - 1;
    }
    ac.hover(ac.list[i]);
  };


  AC.prototype.select = function(item) {
    var ac = this;
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
