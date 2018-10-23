const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/priv', (req, res, next) => {
    const seed = req.query.seed;
    const mnemonicWallet = ethers.Wallet.fromMnemonic(seed, null, ethers.wordlists.en, true);

    console.log('eth priv', mnemonicWallet);
    
    const retObj = {
      msg: 'success',
      result: {
        mnemonicWallet,
      },
    };

    res.end(JSON.stringify(retObj));
  });

  return api;
};