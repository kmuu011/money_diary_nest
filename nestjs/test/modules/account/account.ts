import {AccountEntity} from "../../../src/modules/account/entities/account.entity";
import {getSavedMember} from "../member/member";

export const savedAccountData = {
    idx: 1,
    accountName: '제 1 가계부',
    totalAmount: 0,
    invisibleAmount: 0,
    order: 1,
    member: getSavedMember()
};

export const getSavedAccount = (): AccountEntity => {
    const savedAccount: AccountEntity = new AccountEntity();

    savedAccount.dataMigration(savedAccountData);

    return savedAccount;
}

export const getCreateAccountData = (): AccountEntity => {
    const account = new AccountEntity();

    account.dataMigration({
        idx: 13,
        member: getSavedMember(),
        accountName: '제 2 가계부'
    });

    return account;
}