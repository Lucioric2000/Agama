const ethers = require('ethers');

module.exports = (api) => {  
  api.post('/eth/auth', (req, res, next) => {
    const seed = req.body.seed;
    const network = req.body.network;
    const mnemonicWallet = api.eth._keys(seed);
    
    api.eth.wallet = mnemonicWallet;
    api.eth._connect(network || 'homestead');

    for (let key in api.eth.coins) {
      api.eth.coins[key] = {
        pub: api.eth.wallet.signingKey.address,
      };
    }

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/eth/logout', (req, res, next) => {
    api.eth.wallet = null;

    for (let key in api.eth.coins) {
      api.eth.coins[key] = {};
    }

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.end(JSON.stringify(retObj));
  });

  return api; 
};