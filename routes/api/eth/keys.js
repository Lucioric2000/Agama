const ethers = require('ethers');
const sha256 = require('js-sha256');
const ethUtil = require('ethereumjs-util');

module.exports = (api) => {  
  api.get('/eth/priv', (req, res, next) => {
    const seed = req.query.seed;
    const mnemonicWallet = api.eth._keys(seed);
    
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

  // TODO: priv/seed detect
  api.eth._keys = (seed) => {
    const hash = sha256.create().update(seed);
    bytes = hash.array();
    const iguana = true;

    if (iguana) {
      bytes[0] &= 248;
      bytes[31] &= 127;
      bytes[31] |= 64;
    }
    
    const mnemonicWallet = new ethers.Wallet(ethUtil.bufferToHex(bytes)); //ethers.Wallet.fromMnemonic(seed, null, ethers.wordlists.en, true);
    
    api.log('eth priv');
    api.log(mnemonicWallet);
    
    return mnemonicWallet;
  };

  return api;
};