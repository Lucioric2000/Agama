const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/test', (req, res, next) => {
    const seed = req.query.seed;
    const mnemonicWallet = api.eth._keys(seed);

    api.eth._connect('ropsten');
    
    api.eth._balance()
    .then((balance) => {
      const retObj = {
        msg: 'success',
        result: {
          mnemonicWallet,
          balance,
        },
      };

      res.end(JSON.stringify(retObj));
    });
  });

  return api;  
};