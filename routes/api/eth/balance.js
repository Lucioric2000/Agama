const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');

module.exports = (api) => {  
  api.get('/eth/balance', (req, res, next) => {
    const address = req.query.address;
    
    if (address) {
      api.eth._balanceEtherscan(address, req.query.network)
      .then((balance) => {
        const retObj = {
          msg: 'success',
          result: balance,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    } else {
      api.eth._balance()
      .then((balance) => {
        const retObj = {
          msg: 'success',
          result: balance,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    }
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

  api.eth._balanceEtherscan = (address, network = 'homestead') => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=balance',
        `address=${address}`,
        'tag=latest',
        'apikey=YourApiKeyToken',
      ];
      const _etherscanEndPoint = network === 'homestead' ? 'https://api.etherscan.io/api?' : `https://api-${network}.etherscan.io/api?`;
      const options = {
        url: _etherscanEndPoint + _url.join('&'),
        method: 'GET',
      };

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (_json.message === 'OK' &&
                _json.result) {
              resolve({
                balance: ethers.utils.formatEther(_json.result),                
                balanceWei: _json.result,                
              });
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth balance parse error', 'eth.balance');
            api.log(e, 'eth.balance');
          }
        } else {
          api.log(`eth balance error: unable to request ${network}`, 'eth.balance');
        }
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
      api.log(error, 'eth.txcount');
    });
  };

  return api;
};