const sha256 = require('js-sha256');
const buggySha256 = require('sha256');
const bip39 = require('bip39');
const crypto = require('crypto');
const bigi = require('bigi');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');
const wif = require('wif');

module.exports = (api) => {
  api.wifToWif = (wif, network) => {
    const _network = api.getNetworkData(network.toLowerCase());
    const key = _network.isZcash ? new bitcoinZcash.ECPair.fromWIF(wif, _network, true) : new bitcoin.ECPair.fromWIF(wif, _network, true);

    return {
      pub: key.getAddress(),
      priv: key.toWIF(),
      fromWif: api.fromWif(wif, _network),
    };
  }

  // src: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/ecpair.js#L62
  api.fromWif = (string, network, checkVersion) => {
    const decoded = wif.decode(string);
    const version = decoded.version;
    
    if (!network) throw new Error('Unknown network version');
    
    if (checkVersion) {
      if (network.wifAlt && version !== network.wif && network.wifAlt.indexOf(version) === -1) throw new Error('Invalid network version');
      if (!network.wifAlt && version !== network.wif) throw new Error('Invalid network version');
    }
  
    const d = bigi.fromBuffer(decoded.privateKey);

    const masterKP = network.isZcash ? new bitcoinZcash.ECPair(d, null, {
      compressed: !decoded.compressed,
      network,
    }) : new bitcoin.ECPair(d, null, {
      compressed: !decoded.compressed,
      network,
    });
    
    if (network.wifAlt) {
      let altKP = [];
      
      for (let i = 0; i < network.wifAlt.length; i++) {
        let _network = JSON.parse(JSON.stringify(network));
        _network.wif = network.wifAlt[i];

        const _altKP = network.isZcash ? new bitcoinZcash.ECPair(d, null, {
          compressed: !decoded.compressed,
          network: _network,
        }) : new bitcoin.ECPair(d, null, {
          compressed: !decoded.compressed,
          network: _network,
        });

        altKP.push({
          pub: _altKP.getAddress(),
          priv: _altKP.toWIF(),
          version: network.wifAlt[i],
        });
      }

      return {
        inputKey: decoded,
        master: {
          pub: masterKP.getAddress(),
          priv: masterKP.toWIF(),
          version: network.wif,
        },
        alt: altKP,
      };
    } else {
      return {
        inputKey: decoded,
        master: {
          pub: masterKP.getAddress(),
          priv: masterKP.toWIF(),
          version: network.wif,
        },
      };
    }  
  };

  api.seedToWif = (seed, network, iguana) => {
    let bytes;

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
    const _network = network.pubKeyHash ? network : api.getNetworkData(network.toLowerCase());
    let keyPair = _network.isZcash ? new bitcoinZcash.ECPair(d, null, { network: _network }) : new bitcoin.ECPair(d, null, { network: _network });
    let keys = {
      pub: keyPair.getAddress(),
      priv: keyPair.toWIF(),
      pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
      fromWif: api.fromWif(keyPair.toWIF(), _network),
    };

    let isWif = false;

    try {
      bs58check.decode(seed);
      isWif = true;
    } catch (e) {}

    if (isWif) {
      try {
        keyPair = _network.isZcash ? new bitcoinZcash.ECPair.fromWIF(seed, _network, true) : new bitcoin.ECPair.fromWIF(seed, _network, true);
        keys = {
          priv: keyPair.toWIF(),
          pub: keyPair.getAddress(),
          pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
          fromWif: api.fromWif(keyPair.toWIF(), _network),
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
      const _network = api.electrumJSNetworks[req.query.coin];
      let key = _network.isZcash ? new bitcoinZcash.ECPair.fromWIF(req.query.wif, _network, true) : new bitcoin.ECPair.fromWIF(req.query.wif, _network, true);

      keys = {
        priv: key.toWIF(),
        pub: key.getAddress(),
        fromWif: api.fromWif(key.toWIF(), _network),
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
      const _network = api.electrumJSNetworks[coin];
      const address =  _network.isZcash ? bitcoinZcash.address.toBase58Check(publicKeyHash, api.electrumJSNetworks[coin].pubKeyHash) : bitcoin.address.toBase58Check(publicKeyHash, api.electrumJSNetworks[coin].pubKeyHash);
      api.log(`convert pubkey ${pubkey} -> ${address}`, 'pubkey');
      return address;
    } catch (e) {
      api.log('convert pubkey error: ' + e);
      return false;
    }
  };

  api.post('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const keys = api.seedToWif(
        req.body.seed,
        req.body.network.toLowerCase(),
        req.body.iguana
      );

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
      const keys = api.seedToWif(
        req.query.seed,
        req.query.network.toLowerCase(),
        req.query.iguana
      );

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

  api.getCoinByPub = (address, coin) => {
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
      'mona',
    ];

    try {
      const _b58check = api.electrumJSNetworks[coin.toLowerCase()].isZcash ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);
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
      const _b58check = _network.isZcash ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);

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

          const _network = api.getNetworkData(key);
          
          if (isWif) {
            try {
              const _key = _network.isZcash ? bitcoinZcash.ECPair.fromWIF(_seed, _network, true) : bitcoin.ECPair.fromWIF(_seed, _network, true);
              priv = _key.toWIF();
              pub = _key.getAddress();
            } catch (e) {
              _wifError = true;
              break;
            }
          } else {
            const _keys = api.seedToWif(_seed, _network, req.body.iguana);
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

      if (api.electrumCoins &&
          Object.keys(api.electrumCoins).length) {
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
      }

      if (api.eth.wallet &&
          api.eth.wallet.signingKey &&
          api.eth.wallet.signingKey.mnemonic &&
          api.eth.wallet.signingKey.mnemonic === _seed) {
        for (let key in api.eth.coins) {
          _totalKeys++;
          _matchingKeyPairs++;
  
          _electrumKeys[key] = {
            pub: api.eth.wallet.signingKey.address,
            priv: api.eth.wallet.signingKey.privateKey,
          };
        }
      }

      const retObj = {
        msg: _wifError ? 'error' : 'success',
        result: _wifError ? false : (_matchingKeyPairs === _totalKeys ? (Object.keys(_electrumKeys).length ? _electrumKeys : false) : false),
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