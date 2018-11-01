const ethers = require('ethers');
const sha256 = require('js-sha256');
const ethUtil = require('ethereumjs-util');
const { etherKeys } = require('agama-wallet-lib/src/keys');

module.exports = (api) => {  
  api.get('/eth/priv', (req, res, next) => {
    const seed = req.query.seed;
    const mnemonicWallet = api.eth._keys(seed, true);
    
    const retObj = {
      msg: 'success',
      result: mnemonicWallet,
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/eth/keys', (req, res, next) => {
    const seed = req.body.seed;
    
    if (api.eth.wallet &&
        api.eth.wallet.signingKey &&
        api.eth.wallet.signingKey.mnemonic &&
        api.eth.wallet.signingKey.mnemonic === seed) {
      const retObj = {
        msg: 'success',
        result: api.eth.wallet.signingKey,
      };
      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: false,
      };
      res.end(JSON.stringify(retObj));
    }
  });

  api.eth._keys = etherKeys;

  return api;
};