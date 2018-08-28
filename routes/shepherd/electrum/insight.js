const request = require('request');
const Promise = require('bluebird');

// abstraction layer to communicate with insight explorers

module.exports = (shepherd) => {
  /*shepherd.httpReq = (url, type) => {

  };*/
  shepherd.insightJSCoreActiveCoin = {};

  shepherd.insightJSCore = (electrumServer) => {
    shepherd.log('insight =>', 'insight.server');
    shepherd.log(electrumServer, 'insight.server');

    if (electrumServer) {
      shepherd.insightJSCoreActiveCoin = electrumServer;
    }

    const apiRoutes = (type, address) => {
      if (shepherd.insightJSCoreActiveCoin.nonStdApi) {
        switch (type) {
          case 'transactions':
            return shepherd.insightJSCoreActiveCoin.nonStdApi.transactions.replace('{address}', address);
            break;
          case 'utxo':
            return shepherd.insightJSCoreActiveCoin.nonStdApi.transactions.replace('{utxo}', address);
            break;
          case 'push':
            return shepherd.insightJSCoreActiveCoin.nonStdApi.push;
            break;
        }
      } else {
        switch (type) {
          case 'transactions':
            return `txs/?address=${address}`;
            break;
          case 'utxo':
            return `addr/${address}/utxo`;
            break;
          case 'push':
            return 'tx/send';
            break;
        }
      }
    };

    return {
      insight: true,
      connect: () => {
        shepherd.log('insight fake connect', 'insight.conn');
      },
      close: () => {
        shepherd.log('insight fake close', 'insight.closeConn');
      },
      blockchainAddressGetBalance: (address) => {
        shepherd.log('insight blockchainAddressGetBalance', 'insight.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('utxo', address)}`,
            method: 'GET',
          };

          console.log(`${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('utxo', address)}`, 'insight.getbalance');

          // send back body on both success and error
          // this bit replicates iguana core's behaviour
          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                console.log(_parsedBody, 'insight.getbalance');

                if (_parsedBody) {
                  let _balance = 0;

                  for (let i = 0; i < _parsedBody.length; i++) {
                    _balance += Number(_parsedBody[i].amount);
                  }

                  resolve({
                    confirmed: _balance * 100000000,
                    unconfirmed: 0,
                  });
                }
                shepherd.log(`insight blockchainAddressGetBalance ${address}`, 'insight.getbalance');
              } catch (e) {
                shepherd.log(`parse error insight blockchainAddressGetBalance ${address}`, 'insight.getbalance');
              }
            } else {
              shepherd.log(`req error insight blockchainAddressGetBalance ${address}`, 'insight.getbalance');
            }
          });
        });
      },
      blockchainAddressListunspent: (address) => {
        shepherd.log('insight blockchainAddressListunspent', 'insight.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('utxo', address)}`,
            method: 'GET',
          };

          console.log(`${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('utxo', address)}`, 'insight.listunspent');

          // send back body on both success and error
          // this bit replicates iguana core's behaviour
          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                console.log(_parsedBody, 'insight.listunspent');

                if (_parsedBody) {
                  let _utxos = [];

                  if (_parsedBody.utxo) {
                    _parsedBody = _parsedBody.utxo;
                  }

                  for (let i = 0; i < _parsedBody.length; i++) {
                    _utxos.push({
                      txid: _parsedBody[i].txid,
                      vout: _parsedBody[i].vout,
                      address: _parsedBody[i].address,
                      amount: Number(_parsedBody[i].amount),
                      amountSats: Number(_parsedBody[i].amount) * 100000000,
                      confirmations: _parsedBody[i].confirmations,
                      spendable: true,
                      verified: false,
                    });
                  }

                  resolve(_utxos);
                }
                shepherd.log(`insight blockchainAddressListunspent ${address}`, 'insight.listunspent');
              } catch (e) {
                shepherd.log(`parse error insight blockchainAddressListunspent ${address}`, 'insight.listunspent');
              }
            } else {
              shepherd.log(`req error insight blockchainAddressListunspent ${address}`, 'insight.listunspent');
            }
          });
        });
      },
      blockchainAddressGetHistory: (address) => {
        shepherd.log('insight blockchainAddressGetHistory', 'insight.listtransactions');

        return new Promise((resolve, reject) => {
          const options = {
            url: `${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('transactions', address)}`,
            method: 'GET',
          };

          console.log(`${shepherd.insightJSCoreActiveCoin.address}/${apiRoutes('transactions', address)}`, 'insight.listtransactions');

          // send back body on both success and error
          // this bit replicates iguana core's behaviour
          request(options, (error, response, body) => {
            // console.log(body);
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                console.log(_parsedBody.txs || _parsedBody.transactions, 'insight.listtransactions');

                if (_parsedBody &&
                    (_parsedBody.txs || _parsedBody.transactions)) {
                  const _txs = _parsedBody.txs || _parsedBody.transactions;
                  let txs = [];

                  for (let i = 0; i < _txs.length; i++) {
                    const _parsedTx = {
                      format: {
                        txid: _txs[i].txid,
                        version: _txs[i].version,
                        locktime: _txs[i].locktime,
                      },
                      inputs: _txs[i].vin,
                      outputs: _txs[i].vout,
                      timestamp: _txs[i].time,
                      confirmations: _txs[i].confirmations,
                    };

                    const formattedTx = shepherd.parseTransactionAddresses(_parsedTx, address, shepherd.insightJSCoreActiveCoin.abbr.toLowerCase());

                    if (formattedTx.type) {
                      formattedTx.blocktime = _parsedTx.timestamp;
                      formattedTx.timereceived = _parsedTx.timestamp;
                      formattedTx.hex = 'N/A';
                      formattedTx.inputs = _parsedTx.inputs;
                      formattedTx.outputs = _parsedTx.outputs;
                      formattedTx.locktime = _parsedTx.format.locktime;
                      txs.push(formattedTx);
                    } else {
                      formattedTx[0].blocktime = _parsedTx.timestamp;
                      formattedTx[0].timereceived = _parsedTx.timestamp;
                      formattedTx[0].hex = 'N/A';
                      formattedTx[0].inputs = _parsedTx.inputs;
                      formattedTx[0].outputs = _parsedTx.outputs;
                      formattedTx[0].locktime = _parsedTx.format.locktime;
                      formattedTx[1].blocktime = _parsedTx.timestamp;
                      formattedTx[1].timereceived = _parsedTx.timestamp;
                      formattedTx[1].hex = 'N/A';
                      formattedTx[1].inputs = _parsedTx.inputs;
                      formattedTx[1].outputs = _parsedTx.outputs;
                      formattedTx[1].locktime = _parsedTx.format.locktime;
                      txs.push(formattedTx[0]);
                      txs.push(formattedTx[1]);
                    }
                  }

                  resolve(txs);
                }
                shepherd.log(`insight blockchainAddressGetHistory ${address}`, 'insight.listtransactions');
              } catch (e) {
                shepherd.log(`parse error insight blockchainAddressGetHistory ${address}`, 'insight.listtransactions');
              }
            } else {
              shepherd.log(`req error insight blockchainAddressGetHistory ${address}`, 'insight.listtransactions');
            }
          });
        });
      },
    };
  };

  return shepherd;
}