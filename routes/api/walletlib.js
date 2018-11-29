module.exports = (api) => {
  /*
   *  type: GET
   *  params: none
   */
  api.post('/create_wallet', async (req, res, next) => {
    if (api.checkToken(req.body.token)) {
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
		walletinfo.randomSeedConfirm=walletinfo.randomSeed;
		const isIguana=true;
		const _wifError = api.auth(walletinfo.randomSeed, isIguana);
		logininfo={"seed":walletinfo.randomSeed,"result":_wifError?"error":"success"}
		res.end(JSON.stringify(logininfo));
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
