import {Injectable} from '@nestjs/common';
import {CursorSelectListResponseType, SelectListResponseType} from "../../../common/type/type";
import {AccountEntity} from "../entities/account.entity";
import {CreateAccountHistoryDto} from "./dto/create-accountHistory-dto";
import {UpdateAccountHistoryDto} from "./dto/update-accountHistory-dto";
import {Connection, DeleteResult, UpdateResult} from "typeorm";
import {Message} from "../../../../libs/message";
import {InjectRepository} from "@nestjs/typeorm";
import {AccountHistoryRepository} from "./accountHistory.repository";
import {AccountHistoryEntity} from "./entities/accountHistory.entity";
import {AccountService} from "../account.service";
import {AccountHistoryCategoryRepository} from "./category/accountHistoryCategory.repository";
import {AccountHistoryCategoryEntity} from "./category/entities/accountHistoryCategory.entity";

@Injectable()
export class AccountHistoryService {
    constructor(
        @InjectRepository(AccountHistoryRepository) private readonly accountHistoryRepository: AccountHistoryRepository,
        @InjectRepository(AccountHistoryCategoryRepository) private readonly accountHistoryCategoryRepository: AccountHistoryCategoryRepository,
        private readonly accountService: AccountService,
        private readonly connection: Connection
    ) {}

    async selectOne(account: AccountEntity, accountHistoryIdx: number): Promise<AccountHistoryEntity> {
        return await this.accountHistoryRepository.selectOne(account, accountHistoryIdx);
    }

    async selectList(
        account: AccountEntity, type: number, cursor: number, count: number,
        accountHistoryCategoryIdx?: number
    ): Promise<CursorSelectListResponseType<AccountHistoryEntity>> {
        let categoryInfo;
        if (accountHistoryCategoryIdx) {
            categoryInfo = await this.accountHistoryCategoryRepository
                .selectOne(account.member, accountHistoryCategoryIdx);

            if (!categoryInfo) {
                throw Message.NOT_EXIST('category');
            }
        }

        if(cursor === -1) cursor = undefined;

        const result = await this.accountHistoryRepository.selectList(account, type, cursor, count, categoryInfo);

        return {
            items: result[0],
            cursor,
            count,
            totalCount: result[1],
            last: Math.ceil(result[1] / count) || 1
        };
    }

    async create(account: AccountEntity, createAccountHistoryDto: CreateAccountHistoryDto): Promise<AccountHistoryEntity> {
        const categoryInfo: AccountHistoryCategoryEntity =
            await this.accountHistoryCategoryRepository
                .selectOne(account.member, createAccountHistoryDto.accountHistoryCategoryIdx);

        if (!categoryInfo) {
            throw Message.NOT_EXIST('category');
        }

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        const accountHistory: AccountHistoryEntity = new AccountHistoryEntity();

        accountHistory.dataMigration(createAccountHistoryDto);
        accountHistory.account = account;
        accountHistory.accountHistoryCategory = categoryInfo;

        let insertedAccountHistory: AccountHistoryEntity;

        try {
            insertedAccountHistory = await this.accountHistoryRepository.createAccountHistory(queryRunner, accountHistory);

            await this.accountService.resetTotalAmount(queryRunner, account);

            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }

        return insertedAccountHistory;
    }

    async update(accountHistory: AccountHistoryEntity, updateAccountHistoryDto: UpdateAccountHistoryDto): Promise<UpdateResult> {
        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        accountHistory.dataMigration(updateAccountHistoryDto);

        let updateResult: UpdateResult

        try {
            updateResult = await this.accountHistoryRepository.updateAccountHistory(accountHistory, updateAccountHistoryDto);

            if (updateResult.affected !== 1) {
                throw Message.SERVER_ERROR;
            }

            await this.accountService.resetTotalAmount(queryRunner, accountHistory.account);

            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }

        return updateResult;
    }

    async delete(accountHistory: AccountHistoryEntity): Promise<DeleteResult> {
        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        let deleteResult: DeleteResult;

        try {
            deleteResult = await this.accountHistoryRepository.deleteAccountHistory(accountHistory);

            if (deleteResult.affected !== 1) {
                throw Message.SERVER_ERROR;
            }

            await this.accountService.resetTotalAmount(queryRunner, accountHistory.account);

            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }

        return deleteResult;
    }

}
