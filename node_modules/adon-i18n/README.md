# AdOn Encrypt

A simple translation class driven by JSON locales with fallback to original text and console notification

## Installing

Using npm

```
npm install adon-i18n
```

Using yarn

```
yarn add adon-i18n
```

## Setup

Import ES6 module style

```
import I18n from 'adon-i18n'
```

Or CommonJS style

```
const I18n = require('adon-i18n')
```

#### With a unique JSON object containing all languages

Unique JSON object example *(using both ways of translation)*

```
{
  "en": {
    "En français s'il vous plait": "In french please",
    "In english now": "In english now"
  },
  "fr": {
    "En français s'il vous plait": "En français s'il vous plait",
    "In english now": "En anglais maintenant"
  }
}
```

Import ES6 module style

```
import locales from 'path/to/locales.json'
```

Or CommonJS

```
const locales = require('path/to/locales.json')
```

Then provide it to the class constructor

```
const i18n = new I18n(locales)
```

#### Or by mapping JSON objects for each language

Ready to map JSON object example *(target english language)*

```
{
  "En français s'il vous plait": "In french please",
  "In english now": "In english now"
}
```

Import ES6 module style

```
import en from 'path/to/en.json'
import fr from 'path/to/fr.json'
```

Or CommonJS

```
const en = require('path/to/en.json')
    , fr = require('path/to/fr.json')
```

Then provide them to the class constructor as object properties *(this example use ES6 short-hand notation)*

```
const i18n = new I18n({ en, fr })
```

## Useage

Translate some text

```
i18n.$t('In english now', 'fr')

// Output => 'En anglais maintenant'
```

## Behaviors

Default to 'en' if second argument **lang** isn't provided

```
i18n.$t('En français s'il vous plait')
 
// Output => 'In french please'
```

Return first argument **text** if no translation exist in requested language and notify to console

```
i18n.$t('I didn\'t made a french translation to this', 'fr')

// Console => 'I didn\'t made a french translation to this' in 'fr' is missing 
// Output => 'I didn\'t made a french translation to this'
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
