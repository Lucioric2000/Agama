const ethers = require('ethers');
const request = require('request');
const Promise = require('bluebird');

// http://api.etherscan.io/api?module=account&action=txlist&address=0xea4a2c3431108db25b7e370675ccfa9f0b43df26&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken

module.exports = (api) => {  
  api.get('/eth/transactions', (req, res, next) => {
    const address = req.query.address;
    const network = req.query.network;
    
    api.eth._transactions(address, network)
    .then((transactions) => {
      const retObj = {
        msg: 'success',
        result: transactions,
      };
  
      res.end(JSON.stringify(retObj));  
    });
  });
  
  api.eth._transactions = (address, network = 'homestead', sort = 'asc') => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=txlist',
        `address=${address}`,
        'startblock=0',
        'endblock=99999999',
        `sort=${sort}`,
        'apikey=YourApiKeyToken',
      ];
      const _etherscanEndPoint = network === 'homestead' ? 'https://api.etherscan.io/api?' : `https://api-${network}.etherscan.io/api?`;
      const options = {
        url: _etherscanEndPoint + _url.join('&'),
        method: 'GET',
      };

      console.log(options);

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (_json.message === 'OK' &&
                _json.result) {
              let _txs = [];
              
              // normalize transactions list to btc-like
              if (_json.result.length) {
                for (let i = 0; i < _json.result.length; i++) {
                  _txs.push({
                    blocknumber: _json.result[i].blockNumber,
                    timestamp: _json.result[i].timeStamp,
                    txid: _json.result[i].hash,
                    nonce: _json.result[i].nonce,
                    blockhash: _json.result[i].blockHash,
                    txindex: _json.result[i].transactionIndex,
                    src: _json.result[i].from,
                    address: _json.result[i].to,
                    value: ethers.utils.formatEther(_json.result[i].value),
                    valueWei: _json.result[i].value,
                    gas: ethers.utils.formatEther(_json.result[i].gas),
                    gasWei: _json.result[i].gas,
                    gasPrice: ethers.utils.formatEther(_json.result[i].gasPrice),
                    gasPriceWei: _json.result[i].gasPrice,
                    cumulativeGasUsed: ethers.utils.formatEther(_json.result[i].cumulativeGasUsed),
                    cumulativeGasUsedWei: _json.result[i].cumulativeGasUsed,
                    gasUsed: ethers.utils.formatEther(_json.result[i].gasUsed),
                    gasUsedWei: _json.result[i].gasUsed,
                    error: _json.result[i].isError,
                    txreceipt_status: _json.result[i].txreceipt_status,
                    input: _json.result[i].input,
                    contractAddress: _json.result[i].contractAddress,
                    confirmations: _json.result[i].confirmations,
                  });
                }
              }
              
              resolve(_txs);
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth transactions parse error', 'eth.transactions');
            api.log(e);
          }
        } else {
          api.log(`eth transactions error: unable to request ${network}`, 'eth.transactions');
        }
      });
    });
  };

  return api;
};