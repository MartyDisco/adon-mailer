// Dependencies
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
		// Node Mailer Config
		this.transporter = nodeMailer.createTransport({
			service: options.service
			, auth: { user: options.user, pass: options.pass }
		})
		this.transporterAsync = Promise.promisifyAll(this.transporter)
		// Locales
		this.i18n = new I18n(options.locales || locales)
		// Email Config
		this.sender = options.user
		this.protocol = options.protocol ? options.protocol : 'http'
		this.domain = options.domain ? options.domain : 'localhost'
		this.app = options.app ? options.app : 'Application'
		this.logo = options.logo || null
		this.color = options.color || '#00bcd4'
		// Email Templates
		this.templates = ['user', 'contact'].reduce((a, b) => {
			a[b] = options.templates && options.templates[b]
				? options.templates[b]
				: `${__dirname}/../src/${b}.pug`
			return a
		}, {})
	}

	// Apply Global Email Config
	configGlobalEmail(options) {
		return {
			...options
			, url: `${this.protocol}://${this.domain}`
			, logo: this.logo
			, color: this.color
			, app: this.app
		}
	}

	// Build Email & Send
	buildEmailAndSend(options) {
		// Render Template & Optimize
		options.mail.html = minify(
			juice(pug.renderFile(this.templates[options.template], options, null))
			, { minifyCSS: true }
		)
		return new Promise((resolve, reject) => {
			// Send Email
			this.transporterAsync.sendMailAsync(options.mail)
				.then(info => resolve(info))
				.catch(err => reject(err))
		})
	}

	// Send Transaction Emails for User Sign up & Password Reset
	userTransaction(options) {
		options = {
			// Global Config
			...this.configGlobalEmail(options)
			// Query for Transaction
			, query: `?email=${options.user.email}&token=${options.user.token}`
			// Node Mailer Config
			, mail: { from: `${this.app} <${this.sender}>`, to: options.user.email }
			// Define Template
			, template: 'user'
		}
		return new Promise((resolve, reject) => {
			// Reject Banned Users
			if (options.user.state === 'banned') {
				return reject(this.i18n.$t('User is not allowed to receive email', options.lang))
			}
			// Check User State
			const emailConfig = options.user.state === 'pending'
				// Config for Sign up
				? this.configWelcomeEmail(options)
				// Config for Password Reset
				: this.configResetEmail(options)
			// Build & Send Email
			return this.buildEmailAndSend(emailConfig)
				.then(info => resolve(info))
				.catch(err => reject(err))
		})
	}

	// Apply Sign up/Invite Email Config
	configWelcomeEmail(options) {
		// Config Invite Email
		if (options.invite) return this.configInviteEmail(options)
		// Or Sign up Email
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

	// Apply Password Reset/Team Subscribe Email Config
	configResetEmail(options) {
		// Config Subscription Email
		if (options.invite) return this.configSubscribeEmail(options)
		// Or Password Reset
		options.mail.subject = `[${this.app}] ${this.i18n.$t('Reset your Password', options.lang)}`
		const endText = `${this.app} ${this.i18n.$t('account password.', options.lang)}`
		return {
			...options
			, redirect: '/reset/'
			, header: this.i18n.$t('Password Reset', options.lang)
			, title: this.i18n.$t('Forgot your password ?', options.lang)
			, text: `${this.i18n.$t('Click on the button to reset your', options.lang)} ${endText}`
			, callToAction: this.i18n.$t('Reset', options.lang)
		}
	}

	// Apply Invite (new User) Email Config
	configInviteEmail(options) {
		options.mail.subject = `[${this.app}] ${this.i18n.$t('You have been invited', options.lang)}`
		const endText = `${options.invite}, ${this.i18n.$t('first reset your password to login', options.lang)}`
		return {
			...options
			, redirect: '/login/'
			, header: `${this.i18n.$t('Welcome to', options.lang)} ${this.app}`
			, title: this.i18n.$t('Congratulations !', options.lang)
			, text: `${this.i18n.$t('You have been invited to a team by', options.lang)} ${endText}`
			, callToAction: this.i18n.$t('Join', options.lang)
		}
	}

	// Apply Subscribe (existent User) Email Config
	configSubscribeEmail(options) {
		options.mail.subject = `[${this.app}] ${this.i18n.$t('You have been invited', options.lang)}`
		return {
			...options
			// Add Subscription ID to Query for Transaction
			, query: `${options.query}&subscription=${options.subscription}`
			, redirect: '/login/'
			, header: `${this.i18n.$t('Join the team on', options.lang)} ${this.app}`
			, title: this.i18n.$t('Congratulations !', options.lang)
			, text: `${this.i18n.$t('You have been invited to a team by', options.lang)} ${options.invite}`
			, callToAction: this.i18n.$t('Join', options.lang)
		}
	}

	// Send Contact Email
	contactEmail(options) {
		options = {
			// Global Config
			...this.configGlobalEmail(options)
			// Node Mailer Config
			, mail: {
				from: `${this.app} <${this.sender}>`
				, to: options.to || this.sender
				, replyTo: options.email
				, subject: `[${this.app}] ${this.i18n.$t('New message from', options.lang)} ${options.email}`
			}
			// Contact Email Config
			, header: this.i18n.$t('You\'ve got a new message', options.lang)
			, title: options.email
			, text: options.message
			// Define Template
			, template: 'contact'
		}
		return new Promise((resolve, reject) => Promise.all([
			// Build & Send Contact Email
			this.buildEmailAndSend(options)
			// Build & Send Notification Email
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
}

export default Mailer
