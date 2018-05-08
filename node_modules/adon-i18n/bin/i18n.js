'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var I18n = function () {
	function I18n(locales) {
		_classCallCheck(this, I18n);

		this.locales = locales;
	}

	_createClass(I18n, [{
		key: '$t',
		value: function $t(text) {
			var lang = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'en';

			var messages = this.locales[lang],
			    key = Object.keys(messages).find(function (a) {
				return a === text;
			});
			if (key) return messages[key];
			console.log('\'' + text + '\' in \'' + lang + '\' is missing');
			return text;
		}
	}]);

	return I18n;
}();

exports.default = I18n;
module.exports = exports['default'];
