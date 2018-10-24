const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/priv', (req, res, next) => {
    const seed = req.query.seed;
    const mnemonicWallet = api.eth._keys(seed);

    api.eth.wallet = mnemonicWallet;
    
    const retObj = {
      msg: 'success',
      result: mnemonicWallet,
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/eth/auth', (req, res, next) => {
    const seed = req.body.seed;
    const mnemonicWallet = api.eth._keys(seed);
    
    api.eth.wallet = mnemonicWallet;    

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/eth/keys', (req, res, next) => {
    const seed = req.body.seed;
    const mnemonicWallet = api.eth._keys(seed);
    
    if (api.eth.wallet &&
        api.eth.wallet.signingKey &&
        api.eth.wallet.signingKey.mnemonic &&
        api.eth.wallet.signingKey.mnemonic === seed) {
      const retObj = {
        msg: 'success',
        result: 'true',
      };
    } else {
      const retObj = {
        msg: 'false',
        result: 'true',
      };
    }

    res.end(JSON.stringify(retObj));
  });

  // TODO: priv/seed detect
  api.eth._keys = (seed) => {
    const mnemonicWallet = ethers.Wallet.fromMnemonic(seed, null, ethers.wordlists.en, true);
    
    api.log('eth priv');
    api.log(mnemonicWallet);
    
    return mnemonicWallet;
  };

  return api;  
};