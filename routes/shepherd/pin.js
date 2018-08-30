const fs = require('fs-extra');
const passwdStrength = require('passwd-strength');
const bitcoin = require('bitcoinjs-lib');
const sha256 = require('js-sha256');
const bigi = require('bigi');
const aes256 = require('nodejs-aes256');
const iocane = require('iocane');
const session = iocane.createSession()
  .use('cbc')
  .setDerivationRounds(300000);

const encrypt = session.encrypt.bind(session);
const decrypt = session.decrypt.bind(session);

module.exports = (shepherd) => {
  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/encryptkey', async (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const _pin = req.body.key;
      const _str = req.body.string;

      if (_pin &&
          _str) {
        const hash = sha256.create().update(_str);
        let bytes = hash.array();
        bytes[0] &= 248;
        bytes[31] &= 127;
        bytes[31] |= 64;

        const d = bigi.fromBuffer(bytes);
        const keyPair = new bitcoin.ECPair(d, null, { network: shepherd.getNetworkData('btc') });
        const keys = {
          pub: keyPair.getAddress(),
          priv: keyPair.toWIF(),
        };
        const pubkey = req.body.pubkey ? req.body.pubkey : keyPair.getAddress();

        if (passwdStrength(_pin) < 29) {
          shepherd.log('seed storage weak pin!', 'pin');

          const retObj = {
            msg: 'error',
            result: false,
          };

          res.end(JSON.stringify(retObj));
        } else {
          const _customPinFilenameTest = /^[0-9a-zA-Z-_]+$/g;

          if (_customPinFilenameTest.test(pubkey)) {
            encrypt(req.body.string, _pin)
            .then((encryptedString) => {
              fs.writeFile(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`, encryptedString, (err) => {
                if (err) {
                  shepherd.log('error writing pin file', 'pin');

                  const retObj = {
                    msg: 'error',
                    result: 'error writing pin file',
                  };

                  res.end(JSON.stringify(retObj));
                } else {
                  const retObj = {
                    msg: 'success',
                    result: pubkey,
                  };

                  res.end(JSON.stringify(retObj));
                }
              });
            });
          } else {
            const retObj = {
              msg: 'error',
              result: 'pin file name can only contain alphanumeric characters, dash "-" and underscore "_"',
            };

            res.end(JSON.stringify(retObj));
          }
        }
      } else {
        const _paramsList = [
          'key',
          'string'
        ];
        let retObj = {
          msg: 'error',
          result: '',
        };
        let _errorParamsList = [];

        for (let i = 0; i < _paramsList.length; i++) {
          if (!req.query[_paramsList[i]]) {
            _errorParamsList.push(_paramsList[i]);
          }
        }

        retObj.result = `missing param ${_errorParamsList.join(', ')}`;
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

  shepherd.post('/decryptkey', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const _pubkey = req.body.pubkey;
      const _key = req.body.key;

      if (_key &&
          _pubkey) {
        if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin/${_pubkey}.pin`)) {
          fs.readFile(`${shepherd.agamaDir}/shepherd/pin/${_pubkey}.pin`, 'utf8', async(err, data) => {
            if (err) {
              const retObj = {
                msg: 'error',
                result: err,
              };

              res.end(JSON.stringify(retObj));
            } else {
              const decryptedKey = aes256.decrypt(_key, data);
              const _regexTest = decryptedKey.match(/^[0-9a-zA-Z ]+$/g);

              if (_regexTest) { // re-encrypt with a new method
                encrypt(decryptedKey, _key)
                .then((encryptedString) => {
                  shepherd.log(`seed encrypt old method detected for file ${_pubkey}`, 'pin');

                  fs.writeFile(`${shepherd.agamaDir}/shepherd/pin/${_pubkey}.pin`, encryptedString, (err) => {
                    if (err) {
                      shepherd.log(`error re-encrypt pin file ${_pubkey}`, 'pin');
                    } else {
                      const retObj = {
                        msg: 'success',
                        result: decryptedKey,
                      };

                      res.end(JSON.stringify(retObj));
                    }
                  });
                });
              } else {
                decrypt(data, _key)
                .then((decryptedKey) => {
                  shepherd.log(`pin ${_pubkey} decrypted`, 'pin');

                  const retObj = {
                    msg: 'success',
                    result: decryptedKey,
                  };

                  res.end(JSON.stringify(retObj));
                })
                .catch((err) => {
                  shepherd.log(`pin ${_pubkey} decrypt err ${err}`, 'pin');

                  const retObj = {
                    msg: 'error',
                    result: 'wrong key',
                  };

                  res.end(JSON.stringify(returnObj));
                });
              }
            }
          });
        } else {
          const retObj = {
            msg: 'error',
            result: `file ${req.query.pubkey}.pin doesnt exist`,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'error',
          result: 'missing key or pubkey param',
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

  shepherd.get('/getpinlist', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
        fs.readdir(`${shepherd.agamaDir}/shepherd/pin`, (err, items) => {
          let _pins = [];

          for (let i = 0; i < items.length; i++) {
            if (items[i].substr(items[i].length - 4, 4) === '.pin') {
              _pins.push(items[i].substr(0, items[i].length - 4));
            }
          }

          if (!items.length) {
            const retObj = {
              msg: 'error',
              result: 'no pins',
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: _pins,
            };

            res.end(JSON.stringify(retObj));
          }
        });
      } else {
        const retObj = {
          msg: 'error',
          result: 'pin folder doesn\'t exist',
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

  shepherd.post('/modifypin', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const pubkey = req.body.pubkey;

      if (pubkey) {
        if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`)) {
          fs.readFile(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`, 'utf8', (err, data) => {
            if (err) {
              const retObj = {
                msg: 'error',
                result: err,
              };

              res.end(JSON.stringify(retObj));
            } else {
              if (req.body.delete) {
                fs.unlinkSync(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`);

                const retObj = {
                  msg: 'success',
                  result: `${pubkey}.pin is removed`,
                };

                res.end(JSON.stringify(retObj));
              } else {
                const pubkeynew = req.body.pubkeynew;
                const _customPinFilenameTest = /^[0-9a-zA-Z-_]+$/g;

                if (pubkeynew) {
                  if (_customPinFilenameTest.test(pubkeynew)) {
                    fs.writeFile(`${shepherd.agamaDir}/shepherd/pin/${pubkeynew}.pin`, data, (err) => {
                      if (err) {
                        shepherd.log('error writing pin file', 'pin');

                        const retObj = {
                          msg: 'error',
                          result: 'error writing pin file',
                        };

                        res.end(JSON.stringify(retObj));
                      } else {
                        fs.unlinkSync(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`);

                        const retObj = {
                          msg: 'success',
                          result: pubkeynew,
                        };

                        res.end(JSON.stringify(retObj));
                      }
                    });
                  } else {
                    const retObj = {
                      msg: 'error',
                      result: 'pin file name can only contain alphanumeric characters, dash "-" and underscore "_"',
                    };

                    res.end(JSON.stringify(retObj));
                  }
                } else {
                  const retObj = {
                    msg: 'error',
                    result: 'missing param pubkeynew',
                  };

                  res.end(JSON.stringify(retObj));
                }
              }
            }
          });
        } else {
          const retObj = {
            msg: 'error',
            result: `file ${pubkey}.pin doesnt exist`,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'error',
          result: 'missing pubkey param',
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

  return shepherd;
};