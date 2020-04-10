const express = require('express');
const fetch = require('node-fetch');
const gun = require('gun');

const app = express();

app.use(gun.serve);
app.use(express.static('public'));

const server = app.listen(process.env.PORT || 3000);
const {} = gun({ file: 'data', web: server });

var Turn = require('node-turn');
var turnserver = new Turn({
  // set options
  authMech: 'none',
  debugLevel: 'DEBUG',
  //listeningIps: ['0.0.0.0'],
  listeningPort: 3000,
  log: function(a,b){ console.log('TURN-LOG',a,b||'')},
  debug: function(a,b){ console.log('TURN-DEBUG',a,b||'')}
});
turnserver.start();