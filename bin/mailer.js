'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Dependencies


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

		// Node Mailer Config
		this.transporter = _nodemailer2.default.createTransport({
			service: options.service,
			auth: { user: options.user, pass: options.pass }
		});
		this.transporterAsync = _bluebird2.default.promisifyAll(this.transporter);
		// Locales
		this.i18n = new _adonI18n2.default(options.locales || _locales2.default);
		// Email Config
		this.sender = options.user;
		this.protocol = options.protocol ? options.protocol : 'http';
		this.domain = options.domain ? options.domain : 'localhost';
		this.app = options.app ? options.app : 'Application';
		this.logo = options.logo || null;
		this.color = options.color || '#00bcd4';
		// Email Templates
		this.templates = ['user', 'contact'].reduce(function (a, b) {
			a[b] = options.templates && options.templates[b] ? options.templates[b] : __dirname + '/../src/' + b + '.pug';
			return a;
		}, {});
	}

	// Apply Global Email Config


	_createClass(Mailer, [{
		key: 'configGlobalEmail',
		value: function configGlobalEmail(options) {
			return _extends({}, options, { url: this.protocol + '://' + this.domain,
				logo: this.logo,
				color: this.color,
				app: this.app
			});
		}

		// Build Email & Send

	}, {
		key: 'buildEmailAndSend',
		value: function buildEmailAndSend(options) {
			var _this = this;

			// Render Template & Optimize
			options.mail.html = minify((0, _juice2.default)(_pug2.default.renderFile(this.templates[options.template], options, null)), { minifyCSS: true });
			return new _bluebird2.default(function (resolve, reject) {
				// Send Email
				_this.transporterAsync.sendMailAsync(options.mail).then(function (info) {
					return resolve(info);
				}).catch(function (err) {
					return reject(err);
				});
			});
		}

		// Send Transaction Emails for User Sign up & Password Reset

	}, {
		key: 'userTransaction',
		value: function userTransaction(options) {
			var _this2 = this;

			options = _extends({}, this.configGlobalEmail(options), {
				// Query for Transaction
				query: '?email=' + options.user.email + '&token=' + options.user.token
				// Node Mailer Config
				, mail: { from: this.app + ' <' + this.sender + '>', to: options.user.email
					// Define Template
				}, template: 'user'
			});
			return new _bluebird2.default(function (resolve, reject) {
				// Reject Banned Users
				if (options.user.state === 'banned') {
					return reject(_this2.i18n.$t('User is not allowed to receive email', options.lang));
				}
				// Check User State
				var emailConfig = options.user.state === 'pending'
				// Config for Sign up
				? _this2.configWelcomeEmail(options)
				// Config for Password Reset
				: _this2.configResetEmail(options);
				// Build & Send Email
				return _this2.buildEmailAndSend(emailConfig).then(function (info) {
					return resolve(info);
				}).catch(function (err) {
					return reject(err);
				});
			});
		}

		// Apply Sign up/Invite Email Config

	}, {
		key: 'configWelcomeEmail',
		value: function configWelcomeEmail(options) {
			// Config Invite Email
			if (options.invite) return this.configInviteEmail(options);
			// Or Sign up Email
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Activate your account', options.lang);
			return _extends({}, options, { redirect: '/login/',
				header: this.i18n.$t('Welcome to', options.lang) + ' ' + this.app,
				title: this.i18n.$t('Congratulations !', options.lang),
				text: this.i18n.$t('You are just one click to activate your account.', options.lang),
				callToAction: this.i18n.$t('Activate', options.lang)
			});
		}

		// Apply Password Reset/Team Subscribe Email Config

	}, {
		key: 'configResetEmail',
		value: function configResetEmail(options) {
			// Config Subscription Email
			if (options.invite) return this.configSubscribeEmail(options);
			// Or Password Reset
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Reset your Password', options.lang);
			var endText = this.app + ' ' + this.i18n.$t('account password.', options.lang);
			return _extends({}, options, { redirect: '/reset/',
				header: this.i18n.$t('Password Reset', options.lang),
				title: this.i18n.$t('Forgot your password ?', options.lang),
				text: this.i18n.$t('Click on the button to reset your', options.lang) + ' ' + endText,
				callToAction: this.i18n.$t('Reset', options.lang)
			});
		}

		// Apply Invite (new User) Email Config

	}, {
		key: 'configInviteEmail',
		value: function configInviteEmail(options) {
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('You have been invited', options.lang);
			var endText = options.invite + ', first reset your password to login';
			return _extends({}, options, { redirect: '/login/',
				header: this.i18n.$t('Welcome to', options.lang) + ' ' + this.app,
				title: this.i18n.$t('Congratulations !', options.lang),
				text: this.i18n.$t('You have been invited to a team by', options.lang) + ' ' + endText,
				callToAction: this.i18n.$t('Join', options.lang)
			});
		}

		// Apply Subscribe (existent User) Email Config

	}, {
		key: 'configSubscribeEmail',
		value: function configSubscribeEmail(options) {
			options.mail.subject = '[' + this.app + '] ' + this.i18n.$t('Join the team', options.lang);
			return _extends({}, options, {
				// Add Subscription ID to Query for Transaction
				query: options.query + '&subscription=' + options.subscription,
				redirect: '/login/',
				header: this.i18n.$t('Join the team on', options.lang) + ' ' + this.app,
				title: this.i18n.$t('Congratulations !', options.lang),
				text: this.i18n.$t('You have been invited to a team by', options.lang) + ' ' + options.invite,
				callToAction: this.i18n.$t('Join', options.lang)
			});
		}

		// Send Contact Email

	}, {
		key: 'contactEmail',
		value: function contactEmail(options) {
			var _this3 = this;

			options = _extends({}, this.configGlobalEmail(options), {
				// Node Mailer Config
				mail: {
					from: this.app + ' <' + this.sender + '>',
					to: options.to || this.sender,
					replyTo: options.email,
					subject: '[' + this.app + '] ' + this.i18n.$t('New message from', options.lang) + ' ' + options.email
					// Contact Email Config
				}, header: this.i18n.$t('You\'ve got a new message', options.lang),
				title: options.email,
				text: options.message
				// Define Template
				, template: 'contact'
			});
			return new _bluebird2.default(function (resolve, reject) {
				return _bluebird2.default.all([
				// Build & Send Contact Email
				_this3.buildEmailAndSend(options)
				// Build & Send Notification Email
				, _this3.buildEmailAndSend(_extends({}, options, { mail: {
						from: _this3.app + ' <' + _this3.sender + '>',
						to: options.email,
						subject: '[' + _this3.app + '] ' + _this3.i18n.$t('Your message have been sent', options.lang)
					},
					header: _this3.i18n.$t('Your message have been sent', options.lang)
				}))]).then(function (_ref) {
					var _ref2 = _slicedToArray(_ref, 1),
					    info = _ref2[0];

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
