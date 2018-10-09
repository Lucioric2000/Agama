const Promise = require('bluebird');

module.exports = (api) => {
  api.get('/electrum/getbalance', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const network = req.query.network || api.findNetworkObj(req.query.coin);
      const ecl = api.ecl(network);

      api.log('electrum getbalance =>', 'spv.getbalance');

      ecl.connect();
      ecl.blockchainAddressGetBalance(req.query.address)
      .then((json) => {
        if (json &&
            json.hasOwnProperty('confirmed') &&
            json.hasOwnProperty('unconfirmed')) {
          if (network === 'komodo' ||
              network.toLowerCase() === 'kmd') {
            ecl.blockchainAddressListunspent(req.query.address)
            .then((utxoList) => {
              if (utxoList &&
                  utxoList.length) {
                // filter out < 10 KMD amounts
                let _utxo = [];

                for (let i = 0; i < utxoList.length; i++) {
                  api.log(`utxo ${utxoList[i].tx_hash} sats ${utxoList[i].value} value ${Number(utxoList[i].value) * 0.00000001}`, 'spv.getbalance');

                  if (Number(utxoList[i].value) * 0.00000001 >= 10) {
                    _utxo.push(utxoList[i]);
                  }
                }

                api.log('filtered utxo list =>', 'spv.getbalance');
                api.log(_utxo, 'spv.getbalance');

                if (_utxo &&
                    _utxo.length) {
                  let interestTotal = 0;
                  let utxoIssues = false;

                  Promise.all(_utxo.map((_utxoItem, index) => {
                    if (!_utxoItem.interestRulesCheckPass) {
                      utxoIssues = true;
                    }

                    return new Promise((resolve, reject) => {
                      api.getTransaction(_utxoItem.tx_hash, network, ecl)
                      .then((_rawtxJSON) => {
                        api.log('electrum gettransaction ==>', 'spv.getbalance');
                        api.log((index + ' | ' + (_rawtxJSON.length - 1)), 'spv.getbalance');
                        api.log(_rawtxJSON, 'spv.getbalance');

                        // decode tx
                        const _network = api.getNetworkData(network);
                        let decodedTx;

                        if (api.getTransactionDecoded(_utxoItem.tx_hash, network)) {
                          decodedTx = api.getTransactionDecoded(_utxoItem.tx_hash, network);
                        } else {
                          decodedTx = api.electrumJSTxDecoder(
                            _rawtxJSON,
                            network,
                            _network,
                            api.electrumServers[network].proto === 'insight'
                          );
                          api.getTransactionDecoded(_utxoItem.tx_hash, network, decodedTx);
                        }

                        if (decodedTx &&
                            decodedTx.format &&
                            decodedTx.format.locktime > 0) {
                          interestTotal += api.kmdCalcInterest(
                            decodedTx.format.locktime,
                            _utxoItem.value,
                            _utxoItem.height
                          );
                          api.log(`interest ${interestTotal} for txid ${_utxoItem.tx_hash}`, 'interest');
                        }

                        api.log('decoded tx =>', 'spv.getbalance');
                        api.log(decodedTx, 'spv.getbalance');

                        resolve(true);
                      });
                    });
                  }))
                  .then(promiseResult => {
                    ecl.close();

                    const retObj = {
                      msg: 'success',
                      result: {
                        balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                        unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                        unconfirmedSats: json.unconfirmed,
                        balanceSats: json.confirmed,
                        interest: Number(interestTotal.toFixed(8)),
                        interestSats: Math.floor(interestTotal * 100000000),
                        utxoIssues,
                        total: interestTotal > 0 ? Number((0.00000001 * json.confirmed + interestTotal).toFixed(8)) : 0,
                        totalSats: interestTotal > 0 ? json.confirmed + Math.floor(interestTotal * 100000000) : 0,
                      },
                    };

                    res.end(JSON.stringify(retObj));
                  });
                } else {
                  ecl.close();

                  const retObj = {
                    msg: 'success',
                    result: {
                      balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                      unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                      unconfirmedSats: json.unconfirmed,
                      balanceSats: json.confirmed,
                      interest: 0,
                      interestSats: 0,
                      total: 0,
                      totalSats: 0,
                    },
                  };

                  res.end(JSON.stringify(retObj));
                }
              } else {
                ecl.close();

                const retObj = {
                  msg: 'success',
                  result: {
                    balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                    unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                    unconfirmedSats: json.unconfirmed,
                    balanceSats: json.confirmed,
                    interest: 0,
                    interestSats: 0,
                    total: 0,
                    totalSats: 0,
                  },
                };

                res.end(JSON.stringify(retObj));
              }
            });
          } else {
            ecl.close();
            api.log('electrum getbalance ==>', 'spv.getbalance');
            api.log(json, 'spv.getbalance');

            const retObj = {
              msg: 'success',
              result: {
                balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                unconfirmedSats: json.unconfirmed,
                balanceSats: json.confirmed,
              },
            };

            res.end(JSON.stringify(retObj));
          }
        } else {
          ecl.close();

          const retObj = {
            msg: 'error',
            result: api.CONNECTION_ERROR_OR_INCOMPLETE_DATA,
            electrumres: json,
          };

          res.end(JSON.stringify(retObj));
        }
      });
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