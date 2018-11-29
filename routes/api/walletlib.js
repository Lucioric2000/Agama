module.exports = (api) => {
  /*
   *  type: GET
   *  params: none
   */
  api.post('/create_wallet', async (req, res, next) => {
	//const winston=require("winston");
    if (api.checkToken(req.body.token)) {
    //if (1) {
	  	ppg=require("../../node_modules/agama-wallet-lib/src/crypto/passphrasegenerator.js")
	  	walletinfo={
	      display: false,
	      activeLoginSection: 'activateCoin',
	      loginPassphrase: '',
	      seedInputVisibility: false,
	      loginPassPhraseSeedType: null,
	      bitsOption: 256,
	      randomSeed: '',
	      randomSeedConfirm: '',
	      isSeedConfirmError: false,
	      isSeedBlank: false,
	      displaySeedBackupModal: false,
	      customWalletSeed: false,
	      isCustomSeedWeak: false,
	      trimPassphraseTimer: null,
	      displayLoginSettingsDropdown: false,
	      displayLoginSettingsDropdownSection: null,
	      shouldEncryptSeed: true,
	      encryptKey: '',
	      encryptKeyConfirm: '',
	      decryptKey: '',
	      selectedPin: '',
	      isExperimentalOn: false,
	      enableEncryptSeed: true,
	      isCustomPinFilename: true,
	      customPinFilename: '',
	      selectedShortcutNative: '',
	      selectedShortcutSPV: '',
	      seedExtraSpaces: false
	    };
		walletinfo.randomSeed=ppg.generatePassPhrase(walletinfo.bitsOption);
		//var wmw=__webpack_require__("./util/mainWindow.js");
		var entrop=false;
		var itime=0;
		while (!entrop){
			itime+=1;
			walletinfo.randomSeed=ppg.generatePassPhrase(walletinfo.bitsOption);
			entrop=api.checkStringEntropy(walletinfo.randomSeed);
			if (itime>10){
				entrop=1;
			}
		}
		walletinfo.randomSeedConfirm=walletinfo.randomSeed;
		//walletinfo.ipassphrasegenerationattempt=itime;
		walletinfo.msg="success";
	    res.end(JSON.stringify(walletinfo));
	} else {
		//winston.log("info","invalid login");
        const retObj = {
            msg: 'error',
            result: 'unauthorized access',
        };
	    res.end(JSON.stringify(retObj));
	}
  });
  return api;
};
