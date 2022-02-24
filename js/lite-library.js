var $ = (function() {
	function $(selector, context) {
		if (!selector) {
			return;
		} else if (context) {
			return _$(context).find(selector);
		} else {
			if (typeof selector == "function") {
				this.ready(selector);
			} else if (typeof selector == "object") {
				this.elems = [selector];
			} else {
				this.elems = document.querySelectorAll(selector);
			}
		}
	}
	$.prototype = {
		constructor: $,
		ready: function(callback) {
			if (document.readyState != 'loading') {
				callback();
			} else if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', callback);
			} else {
				document.attachEvent('onreadystatechange', function() {
					if (document.readyState != 'loading') {
						callback();
					}
				});
			}
		},
		found: function() {
			return this.elems.length > 0 ? true : false;
		},
		each: function(callback, thisArg) {
			if (this === null) {
				throw new TypeError("each called on null or undefined");
			}
			var T, index, elements = Object(this.elems), len = elements.length;
			if (!callback || typeof callback !== "function") {
				throw new TypeError(callback + "is not a function");
			}
			if (arguments > 1) {
				T = thisArg;
			}
			index = 0;
			while (index < len) {
				var indexValue;
				if (index in elements) {
					indexValue = elements[index];
					callback.call(T, indexValue, index, elements);
				}
				index++;
			}
			return this;
		},
		eventHandler: {
			events: [],
			findEvent: function(event) {
				return this.events.filter(function(evt) {
					return (evt.type === event);
				}, event)[0];
			},
			removeEvent: function(event, targetElement) {
				var foundEvent = this.findEvent(event);
				if (foundEvent !== undefined) {
					targetElement.removeEventListener(event, foundEvent.event, false);
					this.events = this.events.filter(function(evt) {
						return (evt.type !== event);
					}, event);
				}
			},
			saveEvent: function(event, callback, targetElement) {
				this.events.push({
					type: event,
					event: callback,
					target: targetElement
				});
			},
			direct: function(event, callback, targetElement) {
				this.removeEvent(event, targetElement);
				targetElement.addEventListener(event, callback, false);
				this.saveEvent(event, callback, targetElement);
			},
			delegate: function(event, selector, callback) {
				this.removeEvent(event, document);
				document.addEventListener(event, function(e) {
					for (var target = e.target; target && target != this; target = target.parentNode) {
						if (_$(target).matches(selector)) {
							callback.call(target, e);
						}
						break;
					}
				}, false);
				this.saveEvent(event, callback, document);
			}
		},
		off: function(events) {
			var eventsArray = events.trim().split(/\s+/g);
			for (var i = 0; i < this.elems.length; i++) {
				for (var j = 0; j < eventsArray.length; j++) {
					this.eventHandler.removeEvent(eventsArray[j], this.elems[i]);
				}
			}
		},
		on: function(events, selector, callback) {
			var eventsArray = events.trim().split(/\s+/g);
			for (var i = 0; i < eventsArray.length; i++) {
				var event = eventsArray[i];
				if (arguments.length === 2) {
					for (var j = 0; j < this.elems.length; j++) {
						callback = selector;
						this.eventHandler.direct(event, callback, this.elems[j]);
					}
				} else {
					var selectorArray = selector.replace(/\s+/g, "").split(/,/g);
					for (var k = 0; k < selectorArray.length; k++) {
						this.eventHandler.delegate(event, selectorArray[k], callback);
					}
				}
			}
		},
		click: function() {
			this.get(0).click();
		},
		matches: function(selector) {
			var elements = _$(selector).elems;
			for (var i = 0; i < this.elems.length; i++) {
				for (var j = 0; j < elements.length; j++) {
					if (this.elems[i] == elements[j]) {
						return true;
					}
				}
			}
			return false;
		},
		closest: function(selector, root=document) {
			var element = this.elems[0];
			while (element !== null && !_$(element).matches(selector)) {
				element = element.parentElement;
			}
			return (element == root) ? null : element;
		},
		html: function(htmlString) {
			if (htmlString === undefined) {
				return this.elems[0].innerHTML;
			} else {
				this.each(function(item) {
					item.innerHTML = htmlString;
				});
				return this;
			}
		},
		val: function(value) {
			if (value === undefined) {
				return this.elems[0].value;
			} else {
				this.each(function(item) {
					item.value = value;
				});
				return this;
			}
		},
		data: function(key, value) {
			if (arguments.length === 0) {
				var attributes = {}
				  , array = this.elems[0].getAttributeNames();
				for (var i = 0; i < array.length; i++) {
					if (array[i].match(/^data-/g)) {
						var attrName = array[i].replace(/^data-/g, "");
						attributes[attrName] = this.elems[0].getAttribute(array[i]);
					}
				}
				return attributes;
			} else if (arguments.length === 1) {
				return this.elems[0].getAttribute("data-" + key);
			} else if (arguments.length === 2) {
				this.each(function(item) {
					item.setAttribute("data-" + key, value);
				});
				return this;
			}
		},
		hasClass: function(selector) {
			var elem, i = 0;
			while ((elem = this.elems[i++])) {
				if (selector && new RegExp('(\\s+|^)' + selector + '(\\s+|$)').test(elem.className)) {
					return true;
				}
			}
			return false;
		},
		addClass: function(selector) {
			this.each(function(element) {
				if (!(selector instanceof Array))
					selector = selector.split(/\s+/g);
				for (var i = 0, len = selector.length; i < len; ++i) {
					if (selector[i] && !new RegExp('(\\s+|^)' + selector[i] + '(\\s+|$)').test(element.className)) {
						element.className = element.className.trim() + ' ' + selector[i];
					}
				}
			});
			return this;
		},
		removeClass: function(selector) {
			this.each(function(element) {
				if (!(selector instanceof Array))
					selector = selector.split(/\s+/g);
				for (var i = 0, len = selector.length; i < len; ++i) {
					element.className = element.className.replace(new RegExp('(\\s+|^)' + selector[i] + '(\\s+|$)'), ' ').trim();
				}
			});
			return this;
		},
		replaceClass: function(oldClass, newClass) {
			if (this.hasClass(oldClass)) {
				this.removeClass(oldClass).addClass(newClass);
			}
			return this;
		},
		toggleClass: function(selector) {
			if (this.hasClass(selector)) {
				this.removeClass(selector);
			} else {
				this.addClass(selector);
			}
			return this;
		},
		css: function(propertyName, value) {
			var _this = this;
			if (arguments.length === 1) {
				if (typeof propertyName === "string") {
					if (document.defaultView && document.defaultView.getComputedStyle) {
						return document.defaultView.getComputedStyle(this.elems[0], "").getPropertyValue(propertyName);
					} else {
						return this.elems[0].style[camelCase(propertyName)];
					}
				} else if (typeof propertyName === "object") {
					this.each(function(element) {
						for (var p in propertyName) {
							_this.setStyle(element, p, propertyName[p]);
						}
					});
					return this;
				}
			} else if (arguments.length === 2) {
				this.each(function(element) {
					_this.setStyle(element, propertyName, value);
				});
				return this;
			} else {
				console.error("Invalid argument length");
			}
		},
		setStyle: function(element, key, value) {
			if (element.style.setProperty) {
				element.style.setProperty(key, value);
			} else {
				element.style[camelCase(key)] = value;
			}
		},
		isWindow: function() {
			var obj = this.get(0);
			return obj != null && obj === obj.window;
		},
		isDocument: function() {
			return this.get(0).nodeType === 9 ? true : false;
		},
		dimensions: function(name, value, includeMargin, extra=false) {
			var elem = this.elems[0];
			if (this.isWindow() || this.isDocument()) {
				name = name.indexOf("height") >= 0 ? "Height" : "Width";
				if (this.isWindow()) {
					return name.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
				} else if (this.isDocument()) {
					if (elem.nodeType === 9) {
						var doc = elem.documentElement;
						return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
					}
				}
			}
			if (value === null) {
				if (!extra) {
					return parseInt(this.css(name));
				} else {
					if (name == "innerHeight") {
						return elem["clientHeight"];
					}
					if (name == "innerWidth") {
						return elem["clientWidth"];
					}
					if (name == "outerHeight") {
						var margins = parseInt(this.css("margin-top")) + parseInt(this.css("margin-bottom"));
						return includeMargin ? elem["offsetHeight"] + margins : elem["offsetHeight"];
					}
					if (name == "outerWidth") {
						var margins = parseInt(this.css("margin-left")) + parseInt(this.css("margin-right"));
						return includeMargin ? elem["offsetWidth"] + margins : elem["offsetWidth"];
					}
				}
			} else {
				this.css(name, value);
				return this;
			}
		},
		height: function(value) {
			if (value === void 0)
				value = null;
			return this.dimensions("height", value, false, false);
		},
		innerHeight: function() {
			return this.dimensions("innerHeight", null, false, true);
		},
		outerHeight: function(includeMargin) {
			if (includeMargin === void 0)
				includeMargin = false;
			return this.dimensions("outerHeight", null, includeMargin, true);
		},
		width: function(value) {
			if (value === void 0)
				value = null;
			return this.dimensions("width", value, false, false);
		},
		innerWidth: function() {
			return this.dimensions("innerWidth", null, false, true);
		},
		outerWidth: function(includeMargin) {
			if (includeMargin === void 0)
				includeMargin = false;
			return this.dimensions("outerWidth", null, includeMargin, true);
		},
		offset: function() {
			var rect, win, elem = this.elems[0];
			if (!elem) {
				return;
			}
			if (!elem.getClientRects().length) {
				return {
					top: 0,
					left: 0
				};
			}
			rect = elem.getBoundingClientRect();
			win = elem.ownerDocument.defaultView;
			return {
				top: rect.top + win.pageYOffset,
				left: rect.left + win.pageXOffset
			};
		},
		empty: function() {
			this.html("");
			return this;
		},
		append: function(content) {
			this.each(function(element) {
				element.insertAdjacentHTML("beforeend", content);
			});
			return this;
		},
		prepend: function(content) {
			this.each(function(element) {
				element.insertAdjacentHTML("afterbegin", content);
			});
			return this;
		},
		remove: function() {
			for (var i = 0; i < this.elems.length; i++) {
				var element = this.elems[i];
				if (element && element.parentElement) {
					element.parentElement.removeChild(element);
				}
			}
			return this;
		},
		show: function() {
			this.css("display", "flex");
			return this;
		},
		hide: function() {
			this.css("display", "none");
			return this;
		},
		index: function() {
			if (!this.found())
				return -1;
			var childElements = this.get(0).parentElement.children;
			for (var i = 0; i < childElements.length; i++) {
				if (childElements[i] == this.get(0))
					return i;
			}
			return -1;
		},
		find: function(selector) {
			var elements = this.get()
			  , current = []
			  , previous = []
			  , finalSet = [];
			for (var i = 0; i < elements.length; i++) {
				current = elements[i].querySelectorAll(selector);
				finalSet = previous = merge(previous, current);
			}
			this.elems = finalSet;
			return this;
		},
		get: function(i) {
			if (i === undefined)
				return this.elems;
			var len = this.elems.length
			  , j = +i + (i < 0 ? len : 0);
			return j >= 0 && j < len ? this.elems[j] : null;
		},
		eq: function(i) {
			this.elems = i === undefined ? [] : this.get(i) ? [this.get(i)] : [];
			return this;
		}
	};
	var _$ = function(selector, context) {
		return new $(selector,context);
	};
	return _$;
}
)();

function camelCase(string) {
	return string.replace(/-([a-z])/g, function(match, index, query) {
		return match[1].toUpperCase();
	});
}