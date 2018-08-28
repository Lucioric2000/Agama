const request = require('request');
const Promise = require('bluebird');

// abstraction layer to communicate with electrum proxies

const proxyServers = [{
  ip: '94.130.225.86',
  port: 80,
}, {
  ip: '94.130.98.74',
  port: 80,
}];

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
}

// pick a random proxy server
const _randomServer = proxyServers[getRandomIntInclusive(0, proxyServers.length - 1)];
const proxyServer = {
  ip: _randomServer.ip,
  port: _randomServer.port,
};

console.log(`proxy server ${proxyServer.ip}:${proxyServer.port}`);

module.exports = (shepherd) => {
  /*shepherd.httpReq = (url, type) => {

  };*/
  shepherd.proxyActiveCoin = {};

  shepherd.proxy = (network) => {
    shepherd.log('proxy =>', 'spv.proxy');
    shepherd.log(network, 'spv.proxy');

    if (network) {
      shepherd.proxyActiveCoin = network;
    }

    const _electrumServer = {
      port: shepherd.electrumCoins[network].server.port || shepherd.electrumServers[network].port,
      ip: shepherd.electrumCoins[network].server.ip || shepherd.electrumServers[network].address,
      proto: shepherd.electrumCoins[network].server.proto || shepherd.electrumServers[network].proto,
    };

    const makeUrl = (arr) => {
      let _url = [];

      for (key in _electrumServer) {
        _url.push(`${key}=${_electrumServer[key]}`);
      }

      for (key in arr) {
        _url.push(`${key}=${arr[key]}`);
      }

      return _url.join('&');
    };

    return {
      connect: () => {
        shepherd.log('proxy fake connect', 'spv.proxy.conn');
      },
      close: () => {
        shepherd.log('proxy fake close', 'spv.proxy.closeConn');
      },
      blockchainAddressGetBalance: (address) => {
        shepherd.log(`proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/getbalance?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainAddressGetBalance parsed', 'spv.proxy.getbalance');
                shepherd.log(_parsedBody, 'spv.proxy.getbalance');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
              }
            } else {
              shepherd.log(`req error proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
            }
          });
        });
      },
      blockchainAddressListunspent: (address) => {
        shepherd.log(`proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/listunspent?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainAddressListunspent parsed', 'spv.proxy.getbalance');
                shepherd.log(_parsedBody, 'spv.proxy.getbalance');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
              }
            } else {
              shepherd.log(`req error proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
            }
          });
        });
      },
      blockchainAddressGetHistory: (address) => {
        shepherd.log(`proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/listtransactions?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainAddressGetHistory parsed', 'spv.proxy.listtransactions');
                shepherd.log(_parsedBody, 'spv.proxy.listtransactions');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
              }
            } else {
              shepherd.log(`req error proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
            }
          });
        });
      },
      blockchainEstimatefee: (blocks) => {
        shepherd.log(`proxy blockchainEstimatefee ${blocks}`, 'spv.proxy.estimatefee');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/estimatefee?${makeUrl({ blocks })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainEstimatefee parsed', 'spv.proxy.estimatefee');
                shepherd.log(_parsedBody, 'spv.proxy.estimatefee');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
              }
            } else {
              shepherd.log(`req error proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
            }
          });
        });
      },
      blockchainBlockGetHeader: (height) => {
        shepherd.log(`proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/getblockinfo?${makeUrl({ height })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainBlockGetHeader parsed', 'spv.proxy.getheader');
                shepherd.log(_parsedBody, 'spv.proxy.getheader');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
              }
            } else {
              shepherd.log(`req error proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
            }
          });
        });
      },
      blockchainHeadersSubscribe: () => {
        shepherd.log('proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/getcurrentblock?${makeUrl()}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainHeadersSubscribe parsed', 'spv.proxy.getcurrentblock');
                shepherd.log(_parsedBody, 'spv.proxy.getcurrentblock');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log('proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
              } catch (e) {
                shepherd.log('parse error proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
              }
            } else {
              shepherd.log('req error proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
            }
          });
        });
      },
      blockchainTransactionGet: (txid) => {
        shepherd.log(`proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/gettransaction?${makeUrl({ txid })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainTransactionGet parsed', 'spv.proxy.gettransaction');
                shepherd.log(_parsedBody, 'spv.proxy.gettransaction');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainTransactionGet ${txid}`, 'spv.proxy,.gettransaction');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');
              }
            } else {
              shepherd.log(`req error proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');
            }
          });
        });
      },
      blockchainTransactionGetMerkle: (txid, height) => {
        shepherd.log(`proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/getmerkle?${makeUrl({ txid, height })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainTransactionGetMerkle parsed', 'spv.proxy.merke');
                shepherd.log(_parsedBody, 'spv.proxy.merke');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log(`proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
              } catch (e) {
                shepherd.log(`parse error proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
              }
            } else {
              shepherd.log(`req error proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
            }
          });
        });
      },
      serverVersion: () => {
        shepherd.log('proxy serverVersion', 'spv.proxy.server');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/gettransaction?${makeUrl()}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy serverVersion parsed', 'spv.proxy.server');
                shepherd.log(_parsedBody, 'spv.proxy.server');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log('proxy serverVersion', 'spv.proxy.server');
              } catch (e) {
                shepherd.log('parse error proxy serverVersion', 'spv.proxy.server');
              }
            } else {
              shepherd.log('req error proxy serverVersion', 'spv.proxy.server');
            }
          });
        });
      },
      blockchainTransactionBroadcast: (rawtx) => {
        shepherd.log(`proxy blockchainTransactionBroadcast ${rawtx}`, 'spv.proxy.pushtx');

        return new Promise((resolve, reject) => {
          const options = {
            url: `http://${proxyServer.ip}:${proxyServer.port}/api/pushtx`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              port: _electrumServer.port,
              ip: _electrumServer.ip,
              proto: _electrumServer.proto,
              rawtx,
            }),
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                shepherd.log('proxy blockchainTransactionBroadcast parsed', 'spv.proxy.pushtx');
                shepherd.log(_parsedBody, 'spv.proxy.pushtx');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                shepherd.log('proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
              } catch (e) {
                shepherd.log('parse error proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
              }
            } else {
              shepherd.log('req error proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
            }
          });
        });
      },
    };
  };

  return shepherd;
}