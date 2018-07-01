import htmlMinifier from 'html-minifier'
import I18n from 'adon-i18n'
import juice from 'juice'
import nodeMailer from 'nodemailer'
import Promise from 'bluebird'
import pug from 'pug'

import locales from '../src/locales.json'

const { minify } = htmlMinifier

class Mailer {
	constructor(options) {
		this.transporter = nodeMailer.createTransport({
			service: options.service
			, auth: { user: options.user, pass: options.pass }
		})
		this.transporterAsync = Promise.promisifyAll(this.transporter)
		this.protocol = options.protocol ? options.protocol : 'http'
		this.domain = options.domain ? options.domain : 'localhost'
		this.app = options.app ? options.app : 'Application'
		this.logo = options.logo || null
		this.color = options.color || '#00bcd4'
		this.sender = options.user
		this.i18n = new I18n(options.locales || locales)
		this.templates = ['user', 'contact'].reduce((a, b) => {
			a[b] = options.templates && options.templates[b]
				? options.templates[b]
				: `${__dirname}/../src/${b}.pug`
			return a
		}, {})
	}

	userTransaction(options) {
		options = {
			...this.configGlobalEmail(options)
			, query: `?email=${options.user.email}&token=${options.user.token}`
			, mail: { from: `${this.app} <${this.sender}>`, to: options.user.email }
			, template: 'user'
		}
		let emailConfig
		return new Promise((resolve, reject) => {
			switch (options.user.state) {
				case 'pending': emailConfig = this.configWelcomeEmail(options)
					break
				case 'verified': emailConfig = this.configResetEmail(options)
					break
				default: return reject(this.i18n.$t('User is not allowed to receive email', options.lang))
			}
			return this.buildEmailAndSend(emailConfig)
				.then(info => resolve(info))
				.catch(err => reject(err))
		})
	}

	configGlobalEmail(options) {
		return {
			...options
			, url: `${this.protocol}://${this.domain}`
			, logo: this.logo
			, color: this.color
			, app: this.app
		}
	}

	configWelcomeEmail(options) {
		options.mail.subject = `[${this.app}] ${this.i18n.$t('Activate your account', options.lang)}`
		return {
			...options
			, redirect: '/login/'
			, header: `${this.i18n.$t('Welcome to', options.lang)} ${this.app}`
			, title: this.i18n.$t('Congratulations !', options.lang)
			, text: this.i18n.$t('You are just one click to activate your account.', options.lang)
			, callToAction: this.i18n.$t('Activate', options.lang)
		}
	}

	configResetEmail(options) {
		const endText = `${this.app} ${this.i18n.$t('account password.', options.lang)}`
		options.mail.subject = `[${this.app}] ${this.i18n.$t('Reset your Password', options.lang)}`
		return {
			...options
			, redirect: '/reset/'
			, header: this.i18n.$t('Password Reset', options.lang)
			, title: this.i18n.$t('Forgot your password ?', options.lang)
			, text: `${this.i18n.$t('Click on the button to reset your', options.lang)} ${endText}`
			, callToAction: this.i18n.$t('Reset', options.lang)
		}
	}

	contactEmail(options) {
		options = {
			...this.configGlobalEmail(options)
			, mail: {
				from: `${this.app} <${this.sender}>`
				, to: this.sender
				, replyTo: options.email
				, subject: `[${this.app}] ${this.i18n.$t('New message from', options.lang)} ${options.email}`
			}
			, header: this.i18n.$t('You\'ve got a new message', options.lang)
			, title: options.email
			, text: options.message
			, template: 'contact'
		}
		return new Promise((resolve, reject) => Promise.all([
			this.buildEmailAndSend(options)
			, this.buildEmailAndSend({
				...options
				, mail: {
					from: `${this.app} <${this.sender}>`
					, to: options.email
					, subject: `[${this.app}] ${this.i18n.$t('Your message have been sent', options.lang)}`
				}
				, header: this.i18n.$t('Your message have been sent', options.lang)
			})
		])
            .then(([info]) => resolve(info))
            .catch(err => reject(err)))
	}

	buildEmailAndSend(options) {
		options.mail.html = minify(
			juice(pug.renderFile(this.templates[options.template], options, null))
			, { minifyCSS: true }
		)
		return new Promise((resolve, reject) => {
			this.transporterAsync.sendMailAsync(options.mail)
				.then(info => resolve(info))
				.catch(err => reject(err))
		})
	}
}

export default Mailer
