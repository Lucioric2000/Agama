const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/network/connect', (req, res, next) => {
    const network = req.query.network || 'homestead';
    const _connect = api.eth._connect(network);

    const retObj = {
      msg: 'success',
      result: _connect,
    };

    res.end(JSON.stringify(retObj));
  });

  api.eth._connect = (network) => {
    api.eth.activeWallet = api.eth.wallet.connect(new ethers.getDefaultProvider(network));
    api.log('eth network connect', api.eth.activeWallet);    
  };

  return api;
};