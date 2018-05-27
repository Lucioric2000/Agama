let electrumServers = require('agama-wallet-lib/src/electrum-servers');

const _electrumServers = {
  zen: {
    txfee: 10000,
    abbr: 'ZEN',
  },
  xzc: {
    txfee: 10000,
    abbr: 'XZC',
  },
  iop: {
    txfee: 10000,
    abbr: 'IOP',
  },
  sys: {
    txfee: 10000,
    abbr: 'SYS',
  },
  bta: {
    txfee: 100000,
    abbr: 'BTA',
  },
  erc: {
    txfee: 10000,
    abbr: 'ERC',
  },
  lbc: {
    txfee: 1000,
    abbr: 'LBC',
  },
  bsd: {
    txfee: 10000,
    abbr: 'BSD',
  },
  gbx: {
    txfee: 10000,
    abbr: 'GBX',
  },
  efl: {
    txfee: 100000,
    abbr: 'EFL',
  },
  xwc: {
    txfee: 10000,
    abbr: 'XWC',
  },
  vivo: {
    txfee: 10000,
    abbr: 'VIVO',
  },
  xvg: {
    txfee: 10000,
    abbr: 'XVG',
  },
  xvc: {
    txfee: 10000,
    abbr: 'XVC',
  },
  uno: {
    txfee: 10000,
    abbr: 'UNO',
  },
  smart: {
    txfee: 10000,
    abbr: 'SMART',
  },
  rdd: {
    txfee: 10000,
    abbr: 'RDD',
  },
  pivx: {
    txfee: 10000,
    abbr: 'PIVX',
  },
  omni: {
    txfee: 10000,
    abbr: 'OMNI',
  },
  ok: {
    txfee: 10000,
    abbr: 'OK',
  },
  neos: {
    txfee: 10000,
    abbr: 'NEOS',
  },
  nav: {
    txfee: 10000,
    abbr: 'NAV',
  },
  mnx: {
    txfee: 10000,
    abbr: 'MNX',
  },
  lcc: {
    txfee: 10000,
    abbr: 'LCC',
  },
  nlg: {
    txfee: 10000,
    abbr: 'NLG',
  },
  flash: {
    txfee: 10000,
    abbr: 'FLASH',
  },
  ftc: {
    proto: 'tcp',
    txfee: 10000,
  },
  excl: {
    txfee: 10000,
    abbr: 'EXCL',
  },
  dmd: {
    proto: 'tcp',
    txfee: 10000,
  },
  crave: {
    txfee: 10000,
    abbr: 'CRAVE',
  },
  club: {
    txfee: 10000,
    abbr: 'CLUB',
  },
  clam: {
    txfee: 10000,
    abbr: 'CLAM',
  },
  bca: {
    txfee: 10000,
    abbr: 'BCA',
  },
  aur: {
    txfee: 10000,
    abbr: 'AUR',
  },
  acc: {
    txfee: 10000,
    abbr: 'ACC',
  },
  // insight
  aby: {
    address: 'http://explorer.artbyte.me/api/',
    proto: 'insight',
    insightRawApi: false,
    txfee: 100000,
    abbr: 'ABY',
    serverList: 'none',
  },
  mac: { // cloudfare captcha :(
    address: 'https://explorer.machinecoin.org/api/',
    proto: 'insight',
    insightRawApi: false,
    txfee: 100000,
    abbr: 'MAC',
    serverList: 'none',
  },
  vot: {
    address: 'http://explorer.votecoin.site/insight-api-zcash/',
    proto: 'insight',
    insightRawApi: false,
    txfee: 10000,
    abbr: 'VOT',
    serverList: 'none',
  },
  bdl: {
    address: 'https://explorer.bitdeal.co.in/api/',
    proto: 'insight',
    insightRawApi: false,
    txfee: 10000,
    abbr: 'BDL',
    serverList: 'none',
  },
};

electrumServers = Object.assign({}, electrumServers, _electrumServers);

console.log(electrumServers);

module.exports = electrumServers;