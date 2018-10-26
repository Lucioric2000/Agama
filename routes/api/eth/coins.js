const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/coins', (req, res, next) => {
    if (api.eth.wallet &&
        api.eth.coins &&
        Object.keys(api.eth.coins).length) {
      let _coins = {};

      const retObj = {
        msg: 'success',
        result: api.eth.coins,
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
    const _coin = req.query.coin;
    
    if (_coin) {
      const _coinlc = _coin.toLowerCase();

      if (!api.eth.wallet) {
        api.eth.wallet = {};
      }

      if (_coin &&
          !api.eth.coins[_coinlc]) {
        if (api.eth.wallet.signingKey &&
            api.eth.wallet.signingKey.address) {
          const network = key.indexOf('ropsten') > -1 ? 'ropsten' : 'homestead';
              
          api.eth.coins[_coinlc] = {
            pub: api.eth.wallet.signingKey.address,
            network,
          };
        } else {
          api.eth.coins[_coinlc] = {};
        }

        const retObj = {
          msg: 'success',
          result: 'true',
        };
        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: _coinlc + ' is active',
        };
        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'coin param is empty',
      };
      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/eth/coins/remove', (req, res, next) => {
    const _coin = req.query.coin;

    if (_coin) {
      api.eth.coins[_coin.toLowerCase()] = {};

      const retObj = {
        msg: 'success',
        result: 'true',
      };
      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'coin param is empty',
      };
      res.end(JSON.stringify(retObj));
    }
  });

  return api; 
};