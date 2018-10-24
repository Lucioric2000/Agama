const ethers = require('ethers');

module.exports = (api) => {  
  api.post('/eth/auth', (req, res, next) => {
    const seed = req.body.seed;
    const network = req.body.network;
    const mnemonicWallet = api.eth._keys(seed);
    
    api.eth.wallet = mnemonicWallet;
    api.eth._connect(network || 'homestead');

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.end(JSON.stringify(retObj));
  });

  return api; 
};