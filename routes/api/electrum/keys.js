const sha256 = require('js-sha256');
const buggySha256 = require('sha256');
const bip39 = require('bip39');
const crypto = require('crypto');
const bigi = require('bigi');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');

module.exports = (api) => {
  api.wifToWif = (wif, network) => {
    network = network.toLowerCase();
    const key = api.isZcash(network) ? new bitcoinZcash.ECPair.fromWIF(wif, api.getNetworkData(network), true) : new bitcoin.ECPair.fromWIF(wif, api.getNetworkData(network), true);

    return {
      pub: key.getAddress(),
      priv: key.toWIF(),
    };
  }

  api.seedToWif = (seed, network, iguana) => {
    let bytes;
    network = network.toLowerCase();

    // legacy seed edge case
    if (process.argv.indexOf('spvold=true') > -1) {
      bytes = buggySha256(seed, { asBytes: true });
    } else {
      const hash = sha256.create().update(seed);
      bytes = hash.array();
    }

    if (iguana) {
      bytes[0] &= 248;
      bytes[31] &= 127;
      bytes[31] |= 64;
    }

    const d = bigi.fromBuffer(bytes);
    let keyPair = api.isZcash(network) ? new bitcoinZcash.ECPair(d, null, { network: api.getNetworkData(network) }) : new bitcoin.ECPair(d, null, { network: api.getNetworkData(network) });
    let keys = {
      pub: keyPair.getAddress(),
      priv: keyPair.toWIF(),
      pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
    };

    let isWif = false;

    try {
      bs58check.decode(seed);
      isWif = true;
    } catch (e) {}

    if (isWif) {
      try {
        keyPair = api.isZcash(network) ? bitcoinZcash.ECPair.fromWIF(seed, api.getNetworkData(network), true) : bitcoin.ECPair.fromWIF(seed, api.getNetworkData(network), true);
        keys = {
          priv: keyPair.toWIF(),
          pub: keyPair.getAddress(),
          pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
        };
      } catch (e) {}
    }

    /*api.log(`seed: ${seed}`, true);
    api.log(`network ${network}`, true);
    api.log(`seedtowif priv key ${keys.priv}`, true);
    api.log(`seedtowif pub key ${keys.pub}`, true);*/

    return keys;
  }

  api.get('/electrum/wiftopub', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let key = api.isZcash(req.query.coin.toLowerCase()) ? bitcoinZcash.ECPair.fromWIF(req.query.wif, api.electrumJSNetworks[req.query.coin], true) : bitcoin.ECPair.fromWIF(req.query.wif, api.electrumJSNetworks[req.query.coin], true);
      keys = {
        priv: key.toWIF(),
        pub: key.getAddress(),
      };

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  api.get('/electrum/pubkey/check', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const address = api.pubkeyToAddress(req.query.pubkey, req.query.coin); 
      
      if (address) {
        const retObj = {
          msg: 'success',
          result: {
            pubkey: req.query.pubkey,
            address,            
          },
        };

        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: 'wrong pubkey or coin param',
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.pubkeyToAddress = (pubkey, coin) => {
    try {
      const publicKey = new Buffer(pubkey, 'hex');
      const publicKeyHash = bitcoin.crypto.hash160(publicKey);
      const address = bitcoin.address.toBase58Check(publicKeyHash, api.electrumJSNetworks[coin].pubKeyHash);
      api.log(`convert pubkey ${pubkey} -> ${address}`, 'pubkey');
      return address;
    } catch (e) {
      api.log('convert pubkey error: ' + e);
      return false;
    }
  };

  api.post('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      let keys = api.seedToWif(req.body.seed, req.body.network.toLowerCase(), req.body.iguana);

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  api.get('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let keys = api.seedToWif(req.query.seed, req.query.network.toLowerCase(), req.query.iguana);

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  api.getCoinByPub = (address) => {
    const _skipNetworks = [
      'btc',
      'crw',
      'dgb',
      'arg',
      'zec',
      'nmc',
      'ltc',
      'vtc',
      'via',
      'fair',
      'doge',
      'kmd',
      'mona'
    ];

    try {
      const _b58check = api.isZcash(network.toLowerCase()) ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);
      let _coin = [];

      for (let key in api.electrumJSNetworks) {
        if (_b58check.version === api.electrumJSNetworks[key].pubKeyHash &&
            !_skipNetworks.find((item) => { return item === key ? true : false })) {
          _coin.push(key);
        }
      }

      if (_coin.length) {
        return {
          coin: _coin,
          version: _b58check.version,
        };
      } else {
        return 'Unable to find matching coin version';
      }
    } catch (e) {
      return 'Invalid pub address';
    }
  };

  api.addressVersionCheck = (network, address) => {
    const _network = api.getNetworkData(network.toLowerCase());

    try {
      const _b58check = api.isZcash(network.toLowerCase()) ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);

      if (_b58check.version === _network.pubKeyHash ||
          _b58check.version === _network.scriptHash) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return 'Invalid pub address';
    }
  };

  api.get('/electrum/keys/validateaddress', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: api.addressVersionCheck(req.query.network, req.query.address),
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/electrum/keys', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      let _matchingKeyPairs = 0;
      let _totalKeys = 0;
      let _electrumKeys = {};
      let _seed = req.body.seed;
      let _wifError = false;

      for (let key in api.electrumCoins) {
        if (key !== 'auth') {
          let isWif = false;
          let priv;
          let pub;

          try {
            bs58check.decode(_seed);
            isWif = true;
          } catch (e) {}

          if (isWif) {
            try {
              let key = api.isZcash(key) ? bitcoinZcash.ECPair.fromWIF(_seed, api.getNetworkData(key), true) : bitcoin.ECPair.fromWIF(_seed, api.getNetworkData(key), true);
              priv = key.toWIF();
              pub = key.getAddress();
            } catch (e) {
              _wifError = true;
              break;
            }
          } else {
            let _keys = api.seedToWif(_seed, api.findNetworkObj(key), req.body.iguana);
            priv = _keys.priv;
            pub = _keys.pub;
          }

          if (api.electrumKeys[key].pub === pub &&
              api.electrumKeys[key].priv === priv) {
            _matchingKeyPairs++;
          }
          _totalKeys++;
        }
      }

      if (req.body.active) {
        _electrumKeys = JSON.parse(JSON.stringify(api.electrumKeys));

        for (let key in _electrumKeys) {
          if (!api.electrumCoins[key]) {
            delete _electrumKeys[key];
          }
        }
      } else {
        _electrumKeys = api.electrumKeys;
      }

      const retObj = {
        msg: _wifError ? 'error' : 'success',
        result: _wifError ? false : (_matchingKeyPairs === _totalKeys ? _electrumKeys : false),
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

  api.getSpvFees = () => {
    let _fees = {};

    for (let key in api.electrumServers) {
      if (api.electrumServers[key].txfee) {
        _fees[key.toUpperCase()] = api.electrumServers[key].txfee;
      }
    }

    return _fees;
  };

  api.post('/electrum/seed/bip39/match', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const seed = bip39.mnemonicToSeed(req.body.seed);
      const hdMaster = bitcoin.HDNode.fromSeedBuffer(seed, api.electrumJSNetworks.komodo);
      const matchPattern = req.body.match;
      const _defaultAddressDepth = req.body.addressdepth;
      const _defaultAccountCount = req.body.accounts;
      let _addresses = [];
      let _matchingKey;

      for (let i = 0; i < _defaultAccountCount; i++) {
        for (let j = 0; j < 1; j++) {
          for (let k = 0; k < _defaultAddressDepth; k++) {
            const _key = hdMaster.derivePath(`m/44'/141'/${i}'/${j}/${k}`);

            if (_key.keyPair.getAddress() === matchPattern) {
              _matchingKey = {
                pub: _key.keyPair.getAddress(),
                priv: _key.keyPair.toWIF(),
              };
            }
          }
        }
      }

      const retObj = {
        msg: 'success',
        result: _matchingKey ? _matchingKey : 'address is not found',
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

  return api;
};