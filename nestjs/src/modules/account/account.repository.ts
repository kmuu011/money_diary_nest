import {
    Between,
    DeleteResult,
    EntityRepository, MoreThan,
    QueryRunner,
    Repository, SelectQueryBuilder,
    UpdateResult
} from "typeorm";
import {getUpdateObject} from "../../../libs/utils";
import {AccountEntity} from "./entities/account.entity";
import {MemberEntity} from "../member/entities/member.entity";
import {AccountIncomeOutcomeType} from "../../common/type/type";

@EntityRepository(AccountEntity)
export class AccountRepository extends Repository<AccountEntity> {
    async selectOne(member: MemberEntity, accountIdx: number): Promise<AccountEntity> {
        return await this.findOne({
            where: {member, idx: accountIdx}
        });
    }

    async selectList(
        member: MemberEntity,
        startCursor?: number,
        endCursor?: number,
        count?: number
    ): Promise<[AccountEntity[], number]> {
        startCursor = startCursor || 0;

        const where = {
            member,
            order: MoreThan(startCursor)
        };

        if (endCursor) {
            where.order = Between(startCursor, endCursor);
        }

        let query: SelectQueryBuilder<AccountEntity> =
            this.createQueryBuilder('a')
                .orderBy('`order`', "ASC");

        if (!endCursor && count) {
            query = query.take(count);
        }

        const list = await query
            .where(where)
            .getMany();

        delete where.order;

        const totalCount = await query
            .where(where)
            .getCount();

        return [list, totalCount]
    }

    async selectTotalIncomeOutcome(queryRunner: QueryRunner, member: MemberEntity, accountIdx: number): Promise<AccountIncomeOutcomeType> {
        const queryBuilder: SelectQueryBuilder<AccountEntity>
            = queryRunner ? queryRunner.manager.createQueryBuilder(AccountEntity, 'a', queryRunner)
            : this.createQueryBuilder('a');

        const finalQuery = queryBuilder
            .leftJoinAndSelect('a.accountHistoryList', 'h')
            .where("a.memberIdx = :memberIdx " +
                "AND h.accountIdx = :accountIdx", {memberIdx: member.idx, accountIdx})
            .select("SUM(IF(h.type = 0, h.amount, 0))", "outcome")
            .addSelect("SUM(IF(h.type = 1, h.amount, 0))", "income");

        return await finalQuery.getRawOne();
    }

    async selectTotalAmount(member: MemberEntity): Promise<number> {
        const queryBuilder: SelectQueryBuilder<AccountEntity> =
            this.createQueryBuilder('a')
                .where('a.memberIdx = :memberIdx ' +
                    'AND a.invisibleAmount = 0', {memberIdx: member.idx})
                .select("SUM(a.totalAmount)", "totalAmountOfAllAccount");

        return (await queryBuilder.getRawOne()).totalAmountOfAllAccount;
    }

    async createAccount(queryRunner: QueryRunner, account: AccountEntity): Promise<AccountEntity> {
        if (queryRunner) {
            return await queryRunner.manager.save(account);
        }

        return await this.save(account);
    }

    async updateAccount(queryRunner: QueryRunner, account: AccountEntity): Promise<UpdateResult> {
        const obj = getUpdateObject(
            ["accountName", "order", "invisibleAmount", "totalAmount"],
            account,
            true
        );

        if (queryRunner) {
            return await queryRunner.manager.update(AccountEntity, account.idx, obj);
        } else {
            return await this.update(account.idx, obj);
        }
    }

    async deleteAccount(account: AccountEntity): Promise<DeleteResult> {
        return await this.delete(account.idx);
    }

}