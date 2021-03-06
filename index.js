const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const request = require('superagent');
const Sequelize = require('sequelize');
const { CONVERSATION_API_BASE, TRANSLATE_API_BASE, TOKEN, LANGUAGES } = require('./config')

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:testpassword@localhost:5432/postgres')

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


const Conversation = sequelize.define('conversations', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  status: {
    type: Sequelize.STRING
  },
  language: {
    type: Sequelize.STRING
  },
  first_seen_at: {
    type: Sequelize.INTEGER
  },
  first_seen_id: {
    type: Sequelize.INTEGER
  }
});

// force: true will drop the table if it already exists
Conversation.sync({
  force: true
})

app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/api', (req, res) => {
  if (req.body.type === 'new_message') {
    handleNewMessage(req.body.orgId, req.body.data).then(response => {
      if (response) {
        return sendMessage(req.body.data.conversationId, response)
      }
    })
  }
  if (req.body.type === 'button_action') {
    handleButtonAction(req.body.orgId, req.body.data)
  }
  return res.send('ok')
})


const handleNewMessage = (orgId, data) => {
  if (data.type === 'chat' && data.author.type === 'contact') {
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
        return Conversation.create({
          id: conversationId
        }).then(createdConversation => {
          createdConversation.id = conversationId
          return detect(body).then(language => {
            createdConversation.status = (language === 'en') ?
              'CONVERSATION_STATUS_OFF' :
              'CONVERSATION_STATUS_PENDING'
            createdConversation.language = language
            return createdConversation.save().then(() => parseConversation(orgId, createdConversation, body, true))
          })
        })
      } else {
        return parseConversation(orgId, conversation, body)
      }
    })
}

const parseConversation = (orgId, conversation, body, newConversation = false) => {
  if (conversation.status !== 'CONVERSATION_STATUS_OFF') {
    return translate(body, conversation.get('language')).then(translatedText => {
      if (newConversation) {
        const buttons = [{
            'label': 'Translate away!',
            'value': 'babel-on',
            'type': 'action',
            'style': 'primary',
            'reaction': {
              'type': 'replace',
              'message': 'You got it dude.',
            }
          },
          {
            'label': 'No thanks.',
            'value': 'babel-off',
            'type': 'action',
            'reaction': {
              'type': 'replace',
              'message': 'No worries.',
            }
          },
        ]
        return makeMessage(
          orgId,
          'private_prompt',
          translatedText,
          `It looks like this user is speaking <strong>${LANGUAGES[conversation.get('language')]}</strong>. Here\'s a translation:`,
          'Would you like me help translate the rest of this conversation?',
          buttons
        )
      } else {
        return makeMessage(
          orgId,
          'private_prompt',
          translatedText,
          `Automatically translated from <strong>${LANGUAGES[conversation.get('language')]}</strong>`
        )
      }
    })
  }
}

const handleUserPrivateNote = (orgId, data) => {
  const body = data.body
  const messageId = data.id
  const conversationId = data.conversationId

  if (body.startsWith('/translate')) {
    const textToTranslate = body.replace('/translate ', '')
    sendMessage(conversationId, createDeleteMessage(orgId, messageId))
    return Conversation.findById(conversationId).then(conversation => {
      if (conversation) {
        return translate(textToTranslate, 'en', conversation.get('language')).then(translatedText => {
          const buttons = [{
              'label': 'Send',
              'value': translatedText,
              'type': 'reply',
              'style': 'primary',
              'reaction': {
                type: 'delete'
              }
            },
            {
              'label': 'Edit',
              'value': translatedText,
              'type': 'compose',
              'reaction': {
                type: 'delete'
              }
            },
            {
              'label': 'Cancel',
              'value': 'cancel',
              'type': 'noop',
            },
          ]
          return makeMessage(
            orgId,
            'private_prompt',
            translatedText,
            `Automatically translated to <strong>${LANGUAGES[conversation.get('language')]}</strong>`,
            undefined,
            buttons
          )
        })
      }
    })
  }
}

const createDeleteMessage = (orgId, idToDelete) => {
   return {
    orgId,
    type: 'edit',
    editedMessageId: idToDelete,
    editType: 'delete',
    body: ''
   }
}

const handleButtonAction = (orgId, data) => {
  const buttonValue = data.button.value
  if (!buttonValue.startsWith('babel-')) {
    return
  }
  const value = buttonValue.replace('babel-', '')
  const conversationId = data.conversationId
  return Conversation.findById(conversationId).then(conversation => {
    if (conversation) {
      if (value === 'on') {
        conversation.status = 'CONVERSATION_STATUS_ON'
        return conversation.save()
      }
      if (value === 'off') {
        conversation.status = 'CONVERSATION_STATUS_OFF'
        return conversation.save()
      }
    }
  })
}

const detect = (text) => {
  return request.post(TRANSLATE_API_BASE + `/detect?key=${process.env.GOOGLE_API_KEY}`, {
      'q': text
    }).then(data => {
      return data.body.data.detections[0][0].language
    })
    .catch(err => console.log(err))
}

const translate = (text, source, target = 'en') => {
  return request.post(TRANSLATE_API_BASE + `?key=${process.env.GOOGLE_API_KEY}`, {
      'q': text,
      'target': target,
      'source': source
    }).then(data => {
      return data.body.data.translations[0].translatedText
    })
    .catch(err => console.log(err))
}

const makeMessage = (orgId, type, text, pretext = '', posttext = '', buttons) => {
  const body = `<div>${pretext}<blockquote>${text}</blockquote>${posttext}</div>`
  return {
    orgId,
    body,
    type,
    buttons
  }
}

const sendMessage = (conversationId, message) => {
  return request.post(CONVERSATION_API_BASE + `/${conversationId}/messages`)
    .set('Content-Type', 'application/json')
    .set(`Authorization`, `bearer ${TOKEN}`)
    .send(message)
    .catch(err => console.log(err))
}
