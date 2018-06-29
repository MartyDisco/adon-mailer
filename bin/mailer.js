'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _htmlMinifier = require('html-minifier');

var _htmlMinifier2 = _interopRequireDefault(_htmlMinifier);

var _adonI18n = require('adon-i18n');

var _adonI18n2 = _interopRequireDefault(_adonI18n);

var _juice = require('juice');

var _juice2 = _interopRequireDefault(_juice);

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pug = require('pug');

var _pug2 = _interopRequireDefault(_pug);

var _locales = require('../src/locales.json');

var _locales2 = _interopRequireDefault(_locales);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var minify = _htmlMinifier2.default.minify;

var Mailer = function () {
	function Mailer(options) {
		_classCallCheck(this, Mailer);

		this.transporter = _nodemailer2.default.createTransport({
			service: options.service,
			auth: { user: options.user, pass: options.pass }
		});
		this.transporterAsync = _bluebird2.default.promisifyAll(this.transporter);
		this.protocol = options.protocol ? options.protocol : 'http';
		this.domain = options.domain ? options.domain : 'localhost';
		this.app = options.app ? options.app : 'Application';
		this.logo = options.logo || null;
		this.color = options.color || '#00bcd4';
		this.sender = options.user;
		this.i18n = new _adonI18n2.default(options.locales || _locales2.default);
		this.templates = ['user', 'contact', 'notify'].reduce(function (a, b) {
			a[b] = options.templates && options.templates[b] ? options.templates[b] : __dirname + '/../src/' + b + '.pug';
			return null;
		}, {});
	}

	_createClass(Mailer, [{
		key: 'userTransaction',
		value: function userTransaction(options) {
			var _this = this;

			options = _extends({}, this.configGlobalEmail(options), { query: '?email=' + options.user.email + '&token=' + options.user.token,
				mail: { from: this.app + ' <' + this.sender + '>', to: options.user.email },
				template: 'user'
			});
			var emailConfig = void 0;
			return new _bluebird2.default(function (resolve, reject) {
				switch (options.user.state) {
					case 'pending':
						emailConfig = _this.configWelcomeEmail(options);
						break;
					case 'verified':
						emailConfig = _this.configResetEmail(options);
						break;
					default:
						return reject(_this.i18n.$t('User is not allowed to receive email', options.lang));
				}
				return _this.buildEmailAndSend(emailConfig).then(function (info) {
					return resolve(info);
				}).catch(function (err) {
					return reject(err);
				});
			});
		}
	}, {
		key: 'configGlobalEmail',
		value: function configGlobalEmail(options) {
			return _extends({}, options, { url: this.protocol + '://' + this.domain,
				logo: this.logo,
				color: this.color,
				app: this.app
			});
		}
	}, {
		key: 'configWelcomeEmail',
		value: function configWelcomeEmail(options) {
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Activate your account', options.lang);
			return _extends({}, options, { redirect: '/login/',
				header: this.i18n.$t('Welcome to', options.lang) + ' ' + this.app,
				title: this.i18n.$t('Congratulations !', options.lang),
				text: this.i18n.$t('You are just one click to activate your account.', options.lang),
				callToAction: this.i18n.$t('Activate', options.lang)
			});
		}
	}, {
		key: 'configResetEmail',
		value: function configResetEmail(options) {
			var endText = this.app + ' ' + this.i18n.$t('account password.', options.lang);
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Reset your Password', options.lang);
			return _extends({}, options, { redirect: '/reset/',
				header: this.i18n.$t('Password Reset', options.lang),
				title: this.i18n.$t('Forgot your password ?', options.lang),
				text: this.i18n.$t('Click on the button to reset your', options.lang) + ' ' + endText,
				callToAction: this.i18n.$t('Reset', options.lang)
			});
		}
	}, {
		key: 'contactEmail',
		value: function contactEmail(options) {
			var _this2 = this;

			options = _extends({}, this.configGlobalEmail(options), { mail: { from: this.app + ' <' + this.sender + '>', to: this.sender, replyTo: options.email },
				template: 'contact'
			});
			return new _bluebird2.default(function (resolve, reject) {
				return _this2.buildEmailAndSend(options).then(function () {
					options = _extends({}, options, { mail: { from: _this2.app + ' <' + _this2.sender + '>', to: options.email },
						template: 'notify'
					});
				}).then(function (info) {
					return resolve(info);
				}).catch(function (err) {
					return reject(err);
				});
			});
		}
	}, {
		key: 'buildEmailAndSend',
		value: function buildEmailAndSend(options) {
			var _this3 = this;

			options.mail.html = minify((0, _juice2.default)(_pug2.default.renderFile(this.templates[options.template], options, null)), { minifyCSS: true });
			return new _bluebird2.default(function (resolve, reject) {
				_this3.transporterAsync.sendMailAsync(options.mail).then(function (info) {
					return resolve(info);
				}).catch(function (err) {
					return reject(err);
				});
			});
		}
	}]);

	return Mailer;
}();

exports.default = Mailer;
module.exports = exports['default'];
