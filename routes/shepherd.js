const electron = require('electron');
const express = require('express');
const app = electron.app;
let shepherd = express.Router();

shepherd.setconf = require('../private/setconf.js');
shepherd.nativeCoind = require('./nativeCoind.js');
shepherd.nativeCoindList = {};
shepherd.assetChainPorts = require('./ports.js');
shepherd.assetChainPortsDefault = require('./ports.js');
shepherd._appConfig = require('./appConfig.js');

shepherd.coindInstanceRegistry = {};
shepherd.coindStdout = {};
shepherd.guiLog = {};
shepherd.rpcConf = {};
shepherd.appRuntimeLog = [];
shepherd.appRuntimeSPVLog = [];
shepherd.lockDownAddCoin = false;
shepherd._isWatchOnly = false;

shepherd.staking = {};

// dex cache
shepherd.mmupass = null;
shepherd.mmRatesInterval = null;
shepherd.mmPublic = {
  coins: [],
  mmupass: null,
  swaps: [],
  bids: [],
  asks: [],
  isAuth: false,
  rates: {},
  prices: [],
  coinsHelper: {},
  stats: [],
  electrumServersList: {},
};

// spv vars and libs
shepherd.electrumCoins = {
  auth: false,
};
shepherd.electrumKeys = {};
shepherd.electrumCache = {};

shepherd.electrumJSCore = require('./electrumjs/electrumjs.core.js');
shepherd.electrumJSNetworks = require('./electrumjs/electrumjs.networks.js');
shepherd.electrumServers = require('./electrumjs/electrumServers.js');

shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA = 'connection error or incomplete data';

shepherd.appConfig = shepherd._appConfig.config;

// core
shepherd = require('./shepherd/paths.js')(shepherd);

shepherd.pathsAgama();

// core
shepherd = require('./shepherd/log.js')(shepherd);
shepherd = require('./shepherd/config.js')(shepherd);

shepherd.appConfig = shepherd.loadLocalConfig();

shepherd.pathsDaemons();

shepherd.appConfigSchema = shepherd._appConfig.schema;
shepherd.defaultAppConfig = Object.assign({}, shepherd.appConfig);
shepherd.kmdMainPassiveMode = false;

// spv
shepherd = require('./shepherd/electrum/network.js')(shepherd);
shepherd = require('./shepherd/electrum/coins.js')(shepherd);
shepherd = require('./shepherd/electrum/keys.js')(shepherd);
shepherd = require('./shepherd/electrum/auth.js')(shepherd);
shepherd = require('./shepherd/electrum/merkle.js')(shepherd);
shepherd = require('./shepherd/electrum/balance.js')(shepherd);
shepherd = require('./shepherd/electrum/transactions.js')(shepherd);
shepherd = require('./shepherd/electrum/parseTxAddresses.js')(shepherd);
shepherd = require('./shepherd/electrum/decodeRawtx.js')(shepherd);
shepherd = require('./shepherd/electrum/block.js')(shepherd);
shepherd = require('./shepherd/electrum/createtx.js')(shepherd);
shepherd = require('./shepherd/electrum/createtx-split.js')(shepherd);
shepherd = require('./shepherd/electrum/createtx-multi.js')(shepherd);
shepherd = require('./shepherd/electrum/interest.js')(shepherd);
shepherd = require('./shepherd/electrum/listunspent.js')(shepherd);
shepherd = require('./shepherd/electrum/estimate.js')(shepherd);
shepherd = require('./shepherd/electrum/btcFees.js')(shepherd);
shepherd = require('./shepherd/electrum/insight.js')(shepherd);
shepherd = require('./shepherd/electrum/cache.js')(shepherd);
shepherd = require('./shepherd/electrum/proxy.js')(shepherd);
shepherd = require('./shepherd/electrum/servers.js')(shepherd);
shepherd = require('./shepherd/electrum/csv.js')(shepherd);
shepherd = require('./shepherd/electrum/utils.js')(shepherd);

// dex
/*shepherd = require('./shepherd/dex/coind.js')(shepherd);
shepherd = require('./shepherd/dex/mmControl.js')(shepherd);
shepherd = require('./shepherd/dex/mmRequest.js')(shepherd);
shepherd = require('./shepherd/dex/electrumServersList.js')(shepherd);*/

// core
shepherd = require('./shepherd/addCoinShortcuts.js')(shepherd);
shepherd = require('./shepherd/dashboardUpdate.js')(shepherd);
shepherd = require('./shepherd/binsUtils.js')(shepherd);
shepherd = require('./shepherd/downloadUtil.js')(shepherd);
shepherd = require('./shepherd/init.js')(shepherd);
shepherd = require('./shepherd/pin.js')(shepherd);
shepherd = require('./shepherd/downloadBins.js')(shepherd);
shepherd = require('./shepherd/downloadPatch.js')(shepherd);
shepherd = require('./shepherd/downloadZcparams.js')(shepherd);
shepherd = require('./shepherd/coinsList.js')(shepherd);
shepherd = require('./shepherd/quitDaemon.js')(shepherd);
shepherd = require('./shepherd/rpc.js')(shepherd);
shepherd = require('./shepherd/kickstart.js')(shepherd);
shepherd = require('./shepherd/debugLog.js')(shepherd);
shepherd = require('./shepherd/confMaxconnections.js')(shepherd);
shepherd = require('./shepherd/appInfo.js')(shepherd);
shepherd = require('./shepherd/daemonControl.js')(shepherd);
shepherd = require('./shepherd/auth.js')(shepherd);
shepherd = require('./shepherd/coins.js')(shepherd);
shepherd = require('./shepherd/coindWalletKeys.js')(shepherd);
shepherd = require('./shepherd/addressBook.js')(shepherd);

// elections
shepherd = require('./shepherd/elections.js')(shepherd);

// explorer
// shepherd = require('./shepherd/explorer/overview.js')(shepherd);

// kv
shepherd = require('./shepherd/kv.js')(shepherd);

shepherd.printDirs();

// default route
shepherd.get('/', (req, res, next) => {
  res.send('Agama app server');
});

// expose sockets obj
shepherd.setIO = (io) => {
  shepherd.io = io;
};

shepherd.setVar = (_name, _body) => {
  shepherd[_name] = _body;
};

// spv
if (shepherd.appConfig.spv &&
    shepherd.appConfig.spv.cache) {
  shepherd.loadLocalSPVCache();
}

if (shepherd.appConfig.spv &&
    shepherd.appConfig.spv.customServers) {
  shepherd.loadElectrumServersList();
} else {
  shepherd.mergeLocalKvElectrumServers();
}

shepherd.checkCoinConfigIntegrity();

if (shepherd.appConfig.loadCoinsFromStorage) {
  shepherd.loadCoinsListFromFile();
}

module.exports = shepherd;