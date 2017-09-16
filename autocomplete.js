(function() {

  function getRequest(url, cb) {
    var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.addEventListener('load', function() {
      if(cb) cb(req.response);
    });
    req.open('GET', url);
    req.send();
  }


  var defaults = {
    list: [],
    label: 'label',
    minChars: 2,
    throttle: 500,
    callbacks: {}
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
        var oldList = ac._list, newList = l || [];
        if(oldList && ac.compareLists(oldList, newList)) return;
        ac._list = newList;
        ac.refreshList();
      }
    });

    for(var d in defaults) ac[d] = defaults[d];

    var extendArgs = ['list', 'label', 'url', 'urlParams', 'queryParam', 'minChars', 'throttle', 'callbacks'];
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
        if(ac.element.value === ac.currentValue) return;

        var val = ac.currentValue = ac.element.value;
        if(val.length < ac.minChars) {
          ac.list = [];
          return ac.close();
        }

        if(ac.url && ac.queryParam) ac.getListFromUrl();
        else ac.open();
      }, 50);
    });

    ac.element.addEventListener('focus', function(){ac.open()});
    ac.element.addEventListener('blur', function(){ac.close()});

    ac.ongoingRequests = {};
  };


  AC.prototype.compareLists = function(l1, l2) {
    var ac = this;
    if(l1.length !== l2.length) return false;
    for(var i=0; i<l1.length; i++) if(l1[i][ac.label] !== l2[i][ac.label]) return false;
    return true;
  };


  AC.prototype.refreshList = function() {
    var ac = this;
    ac.listElement.innerHTML = '';
    for(var i=0; i<ac.list.length; i++) {
      (function(x) {
        var e = document.createElement('div');
        e.classList.add('autocomplete-list-item');
        e.textContent = x[ac.label];
        e.addEventListener('mousedown', function(){ac.select(x)});
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


  AC.prototype.positionListElement = function() {
    var ac = this;
    ac.listElement.style.top = (ac.element.offsetTop + ac.element.offsetHeight) + 'px';
    ac.listElement.style.left = ac.element.offsetLeft + 'px';
    ac.listElement.style.width = ac.element.offsetWidth + 'px';
  };


  AC.prototype.open = function() {
    var ac = this;
    if(!ac.list.length) return ac.close();
    ac.positionListElement();
    ac.listElement.classList.remove('autocomplete-hidden');
    ac.element.classList.add('autocomplete-active');
    if(ac.callbacks.open) ac.callbacks.open();
  };


  AC.prototype.close = function() {
    var ac = this;
    ac.listElement.classList.add('autocomplete-hidden');
    ac.element.classList.remove('autocomplete-active');
    delete ac.hovered;
    ac.refreshHovered();
    ac.lastClose = Date.now();
    if(ac.callbacks.close) ac.callbacks.close();
  };


  AC.prototype.hover = function(item) {
    var ac = this;
    ac.hovered = item;
    ac.refreshHovered();
    if(ac.callbacks.hover) ac.callbacks.hover(item);
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
    ac.currentValue = ac.element.value = item[ac.label];
    if(ac.callbacks.select) ac.callbacks.select(item);
  };


  AC.prototype.getListFromUrl = function() {
    var ac = this;
    if(!ac.url || ac._delayedGetList) return;

    var url = ac.url + '?'+ac.queryParam+'='+ac.currentValue;
    if(ac.urlParams) {
      for(var p in ac.urlParams) url += '&'+p+'='+ac.urlParams[p];
    }

    var ts = Date.now();
    var timeSinceLast = ts - ac.ongoingRequests['getListFromUrl'];
    if(timeSinceLast < ac.throttle) return ac.delayedGetListFromUrl(ac.throttle - timeSinceLast);

    ac.ongoingRequests['getListFromUrl'] = ts;
    getRequest(url, function(data) {
      if(!ac.ongoingRequests['getListFromUrl']) return;
      else if(ac.ongoingRequests['getListFromUrl'] === ts) delete ac.ongoingRequests['getListFromUrl'];
      if(ts < ac.lastClose) return;
      ac.list = data;
      ac.open();
    });
  };


  AC.prototype.delayedGetListFromUrl = function(delay) {
    var ac = this;
    if(ac._delayedGetList) return;
    ac._delayedGetList = setTimeout(function() {
      delete ac._delayedGetList;
      if(ac.currentValue.length < ac.minChars) return;
      ac.getListFromUrl();
    }, delay);
  };

})();
