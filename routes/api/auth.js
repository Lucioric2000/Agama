const passwdStrength = require('passwd-strength');

module.exports = (api) => {
  /*
   *  type: GET
   *
   */
  api.get('/auth/status', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let retObj;
      let _status = false;

      if (Object.keys(api.coindInstanceRegistry).length) {
        if (Object.keys(api.electrumCoins).length > 1 &&
        api.electrumCoins.auth) {
          _status = true;
        } else if (
          Object.keys(api.electrumCoins).length === 1 &&
          !api.electrumCoins.auth
        ) {
          _status = true;
        }
      } else if (
        Object.keys(api.electrumCoins).length > 1 &&
        api.electrumCoins.auth
      ) {
        _status = true;
      } else if (
        Object.keys(api.electrumCoins).length === 1 &&
        !Object.keys(api.coindInstanceRegistry).length
      ) {
        _status = true;
      }

      retObj = {
        status: _status ? 'unlocked' : 'locked',
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.checkToken = (token) => {
    if (token === api.appSessionHash ||
        process.argv.indexOf('devmode') > -1) {
      return true;
    }
  };

  api.checkStringEntropy = (str) => {
    // https://tools.ietf.org/html/rfc4086#page-35
    return passwdStrength(str) < 29 ? false : true;
  };

  api.isWatchOnly = () => {
    return api._isWatchOnly;
  };

  api.setPubkey = (seed, coin) => {
    const {
      pub,
      pubHex,
    } = api.seedToWif(seed, 'komodo', true);

    api.staking[coin] = {
      pub,
      pubHex,
    };

    api.log(`pub key for ${coin} is set`, 'pubkey');
    api.log(api.staking[coin], 'pubkey');
  };

  api.getPubkeys = () => {
    return api.staking;
  };

  api.removePubkey = (coin) => {
    delete api.staking[coin];
  };

  return api;
};