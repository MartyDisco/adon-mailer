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
		this.sender = options.user;
		this.i18n = new _adonI18n2.default(options.locales || _locales2.default);
		this.template = function (data) {
			return _pug2.default.renderFile(options.template || __dirname + '/../src/template.pug', data, null);
		};
	}

	_createClass(Mailer, [{
		key: 'userTransaction',
		value: function userTransaction(options) {
			var _this = this;

			options = _extends({
				url: this.protocol + '://' + this.domain,
				logo: this.logo,
				app: this.app,
				query: '?email=' + options.user.email + '&token=' + options.user.token,
				mail: { from: this.app + ' <' + this.sender + '>', to: options.user.email }
			}, options);
			return new _bluebird2.default(function (resolve, reject) {
				var emailConfig = void 0;
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
		key: 'configWelcomeEmail',
		value: function configWelcomeEmail(options) {
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Activate your account', options.lang);
			return _extends({
				redirect: options.url + '/login/',
				header: this.i18n.$t('Welcome to', options.lang) + ' ' + this.app,
				title: this.i18n.$t('Congratulations !', options.lang),
				text: this.i18n.$t('You are just one click to activate your account.', options.lang),
				callToAction: this.i18n.$t('Activate', options.lang)
			}, options);
		}
	}, {
		key: 'configResetEmail',
		value: function configResetEmail(options) {
			var endText = this.app + ' ' + this.i18n.$t('account password.', options.lang);
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Reset your Password', options.lang);
			return _extends({
				redirect: options.url + '/reset/',
				header: this.i18n.$t('Password Reset', options.lang),
				title: this.i18n.$t('Forgot your password ?', options.lang),
				text: this.i18n.$t('Click on the button to reset your', options.lang) + ' ' + endText,
				callToAction: this.i18n.$t('Reset', options.lang)
			}, options);
		}
	}, {
		key: 'buildEmailAndSend',
		value: function buildEmailAndSend(options) {
			var _this2 = this;

			options.mail.html = minify((0, _juice2.default)(this.template(options)), { minifyCSS: true });
			return new _bluebird2.default(function (resolve, reject) {
				_this2.transporterAsync.sendMailAsync(options.mail).then(function (info) {
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
