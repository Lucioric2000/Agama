const ethers = require('ethers');
const Promise = require('bluebird');

module.exports = (api) => {  
  api.get('/eth/balance', (req, res, next) => {
    api.eth._balance()
    .then((balance) => {
      const retObj = {
        msg: 'success',
        result: balance,
      };
  
      res.end(JSON.stringify(retObj));  
    });
  });

  api.eth._balance = () => {
    let _balance = 0;
    let _txCount = 0;

    return new Promise((resolve, reject) => {
      api.eth.activeWallet.getBalance('pending')
      .then((balance) => {
        _balance = ethers.utils.formatEther(balance, { commify: true });

        resolve(_balance);
      }, (error) => {
        api.log('eth balance error', 'eth.balance');
        api.log(error, 'eth.balance');

        resolve(error);
      });
    });
  };

  api.eth._txcount = () => {
    let _txCount = 0;
    
    api.eth.activeWallet.getTransactionCount('pending')
    .then((transactionCount) => {
      _txCount = transactionCount;
      api.log('eth tx count', transactionCount);

      return transactionCount;
    }, (error) => {
      api.log('eth tx count error', 'eth.txcount');
      api.log(error, 'eth.balance');
    });
  };

  return api;
};