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
    } else {
      const retObj = {
        msg: 'error',
        result: 'false',
      };
    }

    res.end(JSON.stringify(retObj));
  });

  return api; 
};