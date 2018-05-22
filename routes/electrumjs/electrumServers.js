let electrumServers = require('agama-wallet-lib/src/electrum-servers');

electrumServers.prlpay = { // !estimatefee
  address: 'electrum1.prlpay.com',
  port: 9681,
  proto: 'tcp',
  txfee: 10000,
  abbr: 'PRLPAY',
  serverList: [
    'electrum1.prlpay.com:9681',
    'electrum2.prlpay.com:9681'
  ],
};

module.exports = electrumServers;