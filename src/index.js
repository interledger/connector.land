'use strict'

const reduct = require('reduct')
const App = require('./app')

const app = reduct()(App)
app.listen()