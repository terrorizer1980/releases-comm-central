/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* global gAccount: false, gIdentity: false, onOk: false, smimeOnAcceptEditor: false */

"use strict";

var EnigmailFuncs = ChromeUtils.import(
  "chrome://openpgp/content/modules/funcs.jsm"
).EnigmailFuncs;
var EnigmailLocale = ChromeUtils.import(
  "chrome://openpgp/content/modules/locale.jsm"
).EnigmailLocale;
var EnigmailWindows = ChromeUtils.import(
  "chrome://openpgp/content/modules/windows.jsm"
).EnigmailWindows;
var EnigmailDialog = ChromeUtils.import(
  "chrome://openpgp/content/modules/dialog.jsm"
).EnigmailDialog;

if (!Enigmail) {
  var Enigmail = {};
}

Enigmail.edit = {
  account: null,
  identity: null,
  enablePgp: null,
  pgpKeyMode: null,
  pgpKeyId: null,
  cryptoChoicesEnabled: null,
  signingPolicy: null, // account specific: by default sign
  encryptionPolicy: null, // account specific: by default encrypt
  pgpMimeMode: null, // account specific: by default pgp/mime
  pgpSignPlainPolicy: null,
  pgpSignEncPolicy: null,
  autoEncryptDrafts: null,
  openPgpSendKeyWithMsg: null,

  onInit() {
    // initialize all of our elements based on the current identity values....
    EnigmailFuncs.collapseAdvanced(
      document.getElementById("enigmail_PrefsBox"),
      "hidden"
    );

    this.enablePgp = document.getElementById("enigmail_enablePgp");
    this.pgpKeyMode = document.getElementById("enigmail_pgpKeyMode");
    this.pgpKeyId = document.getElementById("enigmail_identity.pgpkeyId");
    this.signingPolicy = document.getElementById("enigmail_sign_ifPossible");
    this.encryptionPolicy = document.getElementById(
      "enigmail_encrypt_ifPossible"
    );
    this.pgpMimeMode = document.getElementById("enigmail_pgpMimeMode");
    this.autoEncryptDrafts = document.getElementById(
      "enigmail_autoEncryptDrafts"
    );
    this.mimePreferOpenPGP = document.getElementById(
      "enigmail_mimePreferOpenPGP"
    );
    this.isSingleIdEditor = !!document.getElementById("enigmail_singleId");
    this.openPgpSendKeyWithMsg = document.getElementById(
      "openpgp.sendKeyWithMsg"
    );

    if (this.identity) {
      this.enablePgp.checked = this.identity.getBoolAttribute("enablePgp");
      this.cryptoChoicesEnabled = this.enablePgp.checked;

      var selectedItemId = null;
      var keyPolicy = this.identity.getIntAttribute("pgpKeyMode");
      switch (keyPolicy) {
        case 1:
          selectedItemId = "enigmail_keymode_usePgpkeyId";
          break;
        default:
          selectedItemId = "enigmail_keymode_useFromAddress";
          break;
      }
      this.pgpKeyMode.selectedItem = document.getElementById(selectedItemId);

      var mimePolicy = this.identity.getIntAttribute("mimePreferOpenPGP");
      switch (mimePolicy) {
        case 1:
          selectedItemId = "enigmail_mime_preferEnigmail";
          break;
        default:
          selectedItemId = "enigmail_mime_preferSMime";
          break;
      }
      this.mimePreferOpenPGP.selectedItem = document.getElementById(
        selectedItemId
      );

      this.pgpKeyId.value = this.identity.getCharAttribute("pgpkeyId");
      this.signingPolicy.checked =
        this.identity.getIntAttribute("defaultSigningPolicy") > 0;
      this.encryptionPolicy.checked =
        this.identity.getIntAttribute("defaultEncryptionPolicy") > 0;
      this.pgpMimeMode.checked = this.identity.getBoolAttribute("pgpMimeMode");
      this.pgpSignEncPolicy.checked = this.identity.getBoolAttribute(
        "pgpSignEncrypted"
      );
      this.pgpSignPlainPolicy.checked = this.identity.getBoolAttribute(
        "pgpSignPlain"
      );
      this.autoEncryptDrafts.checked = this.identity.getBoolAttribute(
        "autoEncryptDrafts"
      );
    } else {
      this.enablePgp.checked = false;
      this.cryptoChoicesEnabled = false;
      this.pgpMimeMode.checked = true;
      this.pgpSignEncPolicy.checked = true;
      this.autoEncryptDrafts.checked = true;
    }

    // Disable all locked elements on the panel
    //onLockPreference();
    this.enableAllPrefs();
  },

  onLoadEditor() {
    if (typeof gAccount == "object") {
      this.account = gAccount;
      this.identity = gIdentity;
    } else if ("arguments" in window) {
      this.identity = window.arguments[0].identity;
      this.account = window.arguments[0].account;
    }

    if (this.identity) {
      var idLabel = EnigmailLocale.getString("identityName", [
        this.identity.identityName,
      ]);
      document.getElementById("enigmail_identityName").value = idLabel;
    }

    var dlg = document.getElementsByTagName("dialog")[0];
    dlg.setAttribute(
      "ondialogaccept",
      "return Enigmail.edit.onAcceptEditor();"
    );

    this.onInit();
  },

  onAcceptEditor() {
    try {
      if (onOk() === false) {
        return false;
      }
    } catch (ex) {}
    this.onSave();
    if (typeof smimeOnAcceptEditor == "function") {
      return smimeOnAcceptEditor();
    }
    return true;
  },

  onSave() {
    if (!this.identity) {
      this.identity = gIdentity;
    }
    this.identity.setBoolAttribute("enablePgp", this.enablePgp.checked);
    //To attach OpenPGP Key with the mail
    this.identity.setBoolAttribute(
      "attachPgpKey",
      this.openPgpSendKeyWithMsg.checked
    );

    if (this.enablePgp.checked) {
      // PGP is enabled
      this.identity.setIntAttribute(
        "pgpKeyMode",
        this.pgpKeyMode.selectedItem.value
      );
      this.identity.setIntAttribute(
        "mimePreferOpenPGP",
        this.mimePreferOpenPGP.selectedItem.value
      );
      this.identity.setCharAttribute("pgpkeyId", this.pgpKeyId.value);
      this.identity.setIntAttribute(
        "defaultSigningPolicy",
        this.signingPolicy.checked ? 1 : 0
      );
      this.identity.setIntAttribute(
        "defaultEncryptionPolicy",
        this.encryptionPolicy.checked ? 1 : 0
      );
      this.identity.setBoolAttribute("pgpMimeMode", this.pgpMimeMode.checked);
      this.identity.setBoolAttribute(
        "pgpSignEncrypted",
        this.pgpSignEncPolicy.checked
      );
      this.identity.setBoolAttribute(
        "pgpSignPlain",
        this.pgpSignPlainPolicy.checked
      );
      this.identity.setBoolAttribute(
        "autoEncryptDrafts",
        this.autoEncryptDrafts.checked
      );
    }
  },

  toggleEnable() {
    let newCryptoEnabled = !this.cryptoChoicesEnabled;

    this.cryptoChoicesEnabled = newCryptoEnabled;
    this.enableAllPrefs();
  },

  enableAllPrefs() {
    var elem = document.getElementById("enigmail_bcEnablePgp");
    if (this.cryptoChoicesEnabled) {
      if (elem) {
        elem.removeAttribute("disabled");
      }
    } else if (elem) {
      elem.setAttribute("disabled", "true");
    }

    this.enableKeySel(this.cryptoChoicesEnabled && this.pgpKeyMode.value == 1);
  },

  enableKeySel(enable) {
    if (enable) {
      document
        .getElementById("enigmail_bcUseKeyId")
        .removeAttribute("disabled");
    } else {
      document
        .getElementById("enigmail_bcUseKeyId")
        .setAttribute("disabled", "true");
    }
  },

  handleClick(event) {
    if (event.target.hasAttribute("href")) {
      EnigmailWindows.openMailTab(event.target.getAttribute("href"));
    }
  },

  selectKeyId() {
    var resultObj = {};
    var inputObj = {};
    inputObj.dialogHeader = EnigmailLocale.getString("encryptKeyHeader");
    inputObj.options = "single,hidexpired,private,nosending";
    var button = document.getElementById("enigmail_selectPgpKey");
    var label = button.getAttribute("label");
    inputObj.options += ",sendlabel=" + label;
    inputObj.options += ",";

    window.openDialog(
      "chrome://openpgp/content/ui/enigmailKeySelection.xhtml",
      "",
      "dialog,modal,centerscreen,resizable",
      inputObj,
      resultObj
    );
    try {
      if (resultObj.cancelled) {
        return;
      }
      var selKey = resultObj.userList[0];
      //selKey = "0x"+selKey.substring(10,18);
      this.pgpKeyId.value = selKey;
    } catch (ex) {
      // cancel pressed -> don't send mail
    }
  },
};

window.addEventListener(
  "load-enigmail",
  Enigmail.edit.onLoadEditor.bind(Enigmail.edit)
);

document.addEventListener("dialogaccept", function(event) {
  Enigmail.edit.onAcceptEditor();
});
