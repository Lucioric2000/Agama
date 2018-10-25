const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/coins', (req, res, next) => {
    if (api.eth.wallet &&
        api.eth.wallet.signingKey &&
        api.eth.wallet.signingKey.address) {
      const retObj = {
        msg: 'success',
        result: {
          eth: {
            pub: api.eth.wallet.signingKey.address,
          },
        },
      };
      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'false',
      };
      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/eth/coins/add', (req, res, next) => {
    if (!api.eth.wallet) {
      api.eth.wallet = {};

      const retObj = {
        msg: 'success',
        result: 'true',
      };
      res.end(JSON.stringify(retObj));      
    } else {
      const retObj = {
        msg: 'error',
        result: 'eth is active',
      };
      res.end(JSON.stringify(retObj));      
    }

  });

  return api; 
};