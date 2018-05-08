class I18n {
	constructor(locales) {
		this.locales = locales
	}

	$t(text, lang = 'en') {
		const messages = this.locales[lang]
			, key = Object.keys(messages).find(a => a === text)
		if (key) return messages[key]
		console.log(`'${text}' in '${lang}' is missing`)
		return text
	}
}

export default I18n
