/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This test checks proper operation of the account ordering functionality in the Account manager.
 */

"use strict";

var {
  click_account_tree_row,
  get_account_tree_row,
  open_advanced_settings,
} = ChromeUtils.import(
  "resource://testing-common/mozmill/AccountManagerHelpers.jsm"
);

var { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);

var { mc } = ChromeUtils.import(
  "resource://testing-common/mozmill/FolderDisplayHelpers.jsm"
);

var gPopAccount, gOriginalAccountCount;

add_task(function setupModule(module) {
  // There may be pre-existing accounts from other tests.
  gOriginalAccountCount = MailServices.accounts.allServers.length;

  // Create a POP server
  let popServer = MailServices.accounts
    .createIncomingServer("nobody", "foo.invalid", "pop3")
    .QueryInterface(Ci.nsIPop3IncomingServer);

  let identity = MailServices.accounts.createIdentity();
  identity.email = "tinderbox@foo.invalid";

  gPopAccount = MailServices.accounts.createAccount();
  gPopAccount.incomingServer = popServer;
  gPopAccount.addIdentity(identity);

  // Now there should be one more account.
  Assert.equal(
    MailServices.accounts.allServers.length,
    gOriginalAccountCount + 1
  );
});

registerCleanupFunction(function teardownModule(module) {
  if (gPopAccount) {
    // Remove our test account to leave the profile clean.
    MailServices.accounts.removeAccount(gPopAccount);
    gPopAccount = null;
  }
  // There should be only the original accounts left.
  Assert.equal(MailServices.accounts.allServers.length, gOriginalAccountCount);
});

add_task(function test_account_open_state() {
  open_advanced_settings(function(tab) {
    subtest_check_account_order(tab);
  });
});

/**
 * Check the order of the accounts.
 *
 * @param {Object} tab - The account manager tab.
 */
function subtest_check_account_order(tab) {
  let accountRow = get_account_tree_row(gPopAccount.key, null, tab);
  click_account_tree_row(tab, accountRow);

  let prevAccountList = MailServices.accounts.accounts.map(
    account => account.key
  );

  // Moving the account up to reorder.
  EventUtils.synthesizeKey("VK_UP", { altKey: true });
  mc.sleep(0);
  let curAccountList = MailServices.accounts.accounts.map(
    account => account.key
  );
  Assert.notEqual(curAccountList.join(), prevAccountList.join());

  accountRow = get_account_tree_row(gPopAccount.key, null, tab);
  click_account_tree_row(tab, accountRow);
  // Moving the account down, back to the starting position.
  EventUtils.synthesizeKey("VK_DOWN", { altKey: true });
  mc.sleep(0);
  curAccountList = MailServices.accounts.accounts.map(account => account.key);
  Assert.equal(curAccountList.join(), prevAccountList.join());
}
