const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const request = require('superagent');
const orm = require('pg-orm');

const Conversation = orm.build({
  'tableName': 'conversations',
  'tableProperties': {
    'id': {
      'type': 'key'
    },
    'status': {
      'type': 'string',
      'required': true
    },
    'language': {
      'type': 'string',
      'required': true
    },
    'first_seen_at': {
      'type': 'number',
      'required': true
    },
    'first_seen_id': {
      'type': 'number',
      'required': true
    }
  }
})

const TRANSLATE_API_BASE = 'https://translation.googleapis.com/language/translate/v2'
const CONVERSATION_API_BASE = 'https://conversation2.api.driftqa.com'

const LANGUAGES = {
  "af": "Afrikaans",
  "sq": "Albanian",
  "am": "Amharic",
  "ar": "Arabic",
  "hy": "Armenian",
  "az": "Azeerbaijani",
  "eu": "Basque",
  "be": "Belarusian",
  "bn": "Bengali",
  "bs": "Bosnian",
  "bg": "Bulgarian",
  "ca": "Catalan",
  "ceb": "Cebuano",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  "co": "Corsican",
  "hr": "Croatian",
  "cs": "Czech",
  "da": "Danish",
  "nl": "Dutch",
  "en": "English",
  "eo": "Esperanto",
  "et": "Estonian",
  "fi": "Finnish",
  "fr": "French",
  "fy": "Frisian",
  "gl": "Galician",
  "ka": "Georgian",
  "de": "German",
  "el": "Greek",
  "gu": "Gujarati",
  "ht": "Haitian Creole",
  "ha": "Hausa",
  "haw": "Hawaiian",
  "iw": "Hebrew",
  "hi": "Hindi",
  "hmn": "Hmong",
  "hu": "Hungarian",
  "is": "Icelandic",
  "ig": "Igbo",
  "id": "Indonesian",
  "ga": "Irish",
  "it": "Italian",
  "ja": "Japanese",
  "jw": "Javanese",
  "kn": "Kannada",
  "kk": "Kazakh",
  "km": "Khmer",
  "ko": "Korean",
  "ku": "Kurdish",
  "ky": "Kyrgyz",
  "lo": "Lao",
  "la": "Latin",
  "lv": "Latvian",
  "lt": "Lithuanian",
  "lb": "Luxembourgish",
  "mk": "Macedonian",
  "mg": "Malagasy",
  "ms": "Malay",
  "ml": "Malayalam",
  "mt": "Maltese",
  "mi": "Maori",
  "mr": "Marathi",
  "mn": "Mongolian",
  "my": "Myanmar (Burmese)",
  "ne": "Nepali",
  "no": "Norwegian",
  "ny": "Nyanja (Chichewa)",
  "ps": "Pashto",
  "fa": "Persian",
  "pl": "Polish",
  "pt": "Portuguese (Portugal, Brazil)",
  "pa": "Punjabi",
  "ro": "Romanian",
  "ru": "Russian",
  "sm": "Samoan",
  "gd": "Scots Gaelic",
  "sr": "Serbian",
  "st": "Sesotho",
  "sn": "Shona",
  "sd": "Sindhi",
  "si": "Sinhala (Sinhalese)",
  "sk": "Slovak",
  "sl": "Slovenian",
  "so": "Somali",
  "es": "Spanish",
  "su": "Sundanese",
  "sw": "Swahili",
  "sv": "Swedish",
  "tl": "Tagalog (Filipino)",
  "tg": "Tajik",
  "ta": "Tamil",
  "te": "Telugu",
  "th": "Thai",
  "tr": "Turkish",
  "uk": "Ukrainian",
  "ur": "Urdu",
  "uz": "Uzbek",
  "vi": "Vietnamese",
  "cy": "Welsh",
  "xh": "Xhosa",
  "yi": "Yiddish",
  "yo": "Yoruba",
  "zu": "Zulu"
}

const TOKEN = process.env.BOT_API_TOKEN

app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/api', (req, res) => {
  if (req.body.type === 'new_message') {
    console.log('new messages')
    handleNewMessage(req.body.orgId, req.body.data).then(response => {
      console.log('response', response)
      if (response) {
        return sendMessage(req.body.data.conversationId, response)
      }
    })
  }
  if (req.body.type === 'button_action') {
    handleButton(req.body.orgId, req.body.data)
  }
  console.log()
  return res.send('ok')
})


const handleNewMessage = (orgId, data) => {
  console.log('data', data)
  if (data.type === 'chat' && data.author.type === 'contact') {
    console.log('new chat')
    return handleContactChat(orgId, data)
  }
  if (data.type === 'private_note' && data.author.type === 'user') {
    return handleUserPrivateNote(orgId, data)
  }
  return Promise.resolve()
}

const handleContactChat = (orgId, data) => {
  const body = data.body
  const conversationId = data.conversationId
  
  return Conversation.findById(conversationId)
    .then(conversation => {
      if (!conversation) {
        return Conversation.create().then(createdConversation => {
          const language = detect(body)
          createdConversation.status = (language === 'en')
            ? 'CONVERSATION_STATUS_OFF'
            : 'CONVERSATION_STATUS_PENDING'
          createdConversation.language = language
          return createdConversation.update().then(() => parseConversation(createdConversation, body, true))
        })
      } else {
        return parseConversation(conversation, body)
      }
    })
}

const parseConversation = (conversation, body, newConversation = false) => {
  if (conversation.status !== 'CONVERSATION_STATUS_OFF') {
    translate(body, conversation.language).then(translatedText => {
      if (newConversation) {
        const buttons = [
          {
            'label': 'Translate away!', 'value': 'on', 'type': 'action', 'style': 'primary',
            'reaction': 'You got it dude.'},
          { 'label': 'No thanks.', 'value': 'off', 'type': 'action', 'reaction': 'No worries.'},
        ]

        return makeMessage(
          orgId,
          'private_prompt',
          translatedText,
          `It looks like this user is speaking <strong>${LANGUAGES[conversation.language]}</strong>. Here\'s a translation:`,
          'Would you like me help translate the rest of this conversation?',
          buttons
        )
      } else {
        return makeMessage(
          orgId,
          'private_prompt',
          translated_text,
          `Automatically translated from <strong>${LANGUAGES[conversation.language]}</strong>`
        )
      }
    })
  }
}

const handleUserPrivateNote = (orgId, data) => {
  const body = data.body
  
  if (body.startsWith('/translate')) {
    const textToTranslate = body.replace('/translate ', '')
    Conversation.findById(data.conversationId).then(conversation => {
      if (conversation) {
        return translate(body, conversation.language).then(translatedText => {
          return makeMessage(
            orgId,
            'private_prompt',
            translated_text,
            `Automatically translated to <strong>${LANGUAGES[conversation.language]}</strong>`,
            [
              { 'label': 'Send', 'value': translated_text, 'type': 'reply', 'style': 'primary' },
              { 'label': 'Edit', 'value': translated_text, 'type': 'compose' },
              { 'label': 'Cancel', 'value': 'cancel', 'type': 'action' },
            ]
          )
        })
      }
    })
  }
}

const handleButtonAction = (orgId, data) => {
  const value = data.button.value
  const conversationId = data.conversationId
  return Conversation.findById(conversationId).then(conversation => {
    if (conversation) {
      if (value === 'on') {
        conversation.status = 'CONVERSATION_STATUS_ON'
        return conversation.update()
      }
      if (value === 'off') {
        conversation.status = 'CONVERSATION_STATUS_OFF'
        return conversation.update()
      }
    }
  })
}

const detect = (text) => {
  return request.get(TRANSLATE_API_BASE + '/detect', params = { 'q': text, 'key': process.env.GOOGLE_APIKEY }).then(data => 
    data.data.detections[0][0].language)
}

const translate = (text, target = 'en', source) => {
  return requests.get(TRANSLATE_API_BASE, params = { 'q': text, 'target': target, 'source': source, 'key': process.env.GOOGLE_APIKEY }).then(data => 
    data.translated_text)
}

const makeMessage = (orgId, type, text, pretext = '', posttext = '', button) => {
  const body = `<div>${pretext}<blockquote>${text}</blockquote>${posttext}</div>`
  return {
    orgId,
    body,
    type,
    button
  }
}

const sendMessage = (conversationId, message) => {
  return request.post(CONVERSATION_API_BASE + `/open/conversations/${conversationId}/messages`)
    .set('Content-Type', 'application/json')
    .set(`Authorization`, `bearer ${TOKEN}`)
    .send(message)
}
