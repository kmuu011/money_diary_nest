import {getSavedMember} from "../member/member";
import {Test, TestingModule} from "@nestjs/testing";
import {Member} from "../../../src/modules/member/entities/member.entity";
import {TodoGroupService} from "../../../src/modules/todoGroup/todoGroup.service";
import {getRepositoryToken, TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmOptions} from "../../../config/config";
import {TodoGroupRepository} from "../../../src/modules/todoGroup/todoGroup.repository";
import {TodoGroup} from "../../../src/modules/todoGroup/entities/todoGroup.entity";
import {getCreateTodoGroupData, getSavedTodoGroup} from "./todoGroup";
import {SelectListResponseType} from "../../../src/common/type/type";
import {CreateTodoGroupDto} from "../../../src/modules/todoGroup/dto/create-todoGroup-dto";
import {UpdateTodoGroupDto} from "../../../src/modules/todoGroup/dto/update-todoGroup-dto";
import {DeleteResult, UpdateResult} from "typeorm";

describe('TodoGroup Service', () => {
    const savedMemberInfo: Member = getSavedMember();
    const savedTodoGroupInfo: TodoGroup = getSavedTodoGroup();
    let todoGroupService: TodoGroupService;
    let createdTodoGroup: TodoGroup;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(typeOrmOptions),
                TypeOrmModule.forFeature([
                    TodoGroupRepository
                ])
            ],
            providers: [
                TodoGroupService,
            ]
        }).compile();

        todoGroupService = module.get<TodoGroupService>(TodoGroupService)
    });

    describe('arrangeOrder()', () => {
        it('할일 그룹 순서 정렬', async () => {
            const insertedDummyTodoGroupList: TodoGroup[] = [];
            const insertDummyCount: number = Math.ceil(Math.random()*10)+1;
            const todoGroup: TodoGroup = getSavedTodoGroup();

            for(let i=0 ; i<insertDummyCount ; i++){
                todoGroup.idx = i+33;
                insertedDummyTodoGroupList.push(await todoGroupService.create(savedMemberInfo, todoGroup));
            }
            todoGroup.idx = 2;

            const todoGroupStatus: SelectListResponseType<TodoGroup> =
                await todoGroupService.selectList(savedMemberInfo, 1, 100);

            const totalCount: number = todoGroupStatus.totalCount;
            const randomOrder: number = Math.ceil(Math.random()*totalCount)+1;

            await todoGroupService.arrangeOrder(savedMemberInfo, todoGroup, randomOrder);

            const orderChangedTodoGroupList: SelectListResponseType<TodoGroup> =
                await todoGroupService.selectList(savedMemberInfo, 1, 100);

            expect(orderChangedTodoGroupList.items.findIndex(t => t.order === randomOrder) === totalCount-randomOrder).toBeTruthy();

            for(const t of insertedDummyTodoGroupList){
                await todoGroupService.delete(savedMemberInfo, t);
            }
        });
    });

    describe('selectOne()', () => {
       it('할일 그룹 상세 조회', async () => {
           const todoGroup: TodoGroup = await todoGroupService.selectOne(savedMemberInfo, savedTodoGroupInfo.idx);

           expect(todoGroup instanceof TodoGroup).toBeTruthy();
       });
    });

    describe('selectList()', () => {
       it('할일 그룹 리스트 조회', async () => {
           const todoGroupList: SelectListResponseType<TodoGroup>
               = await todoGroupService.selectList(savedMemberInfo, 1, 10);

           expect(todoGroupList.items.every(t => t instanceof TodoGroup)).toBeTruthy();
       });
    });

    describe('create()', () => {
       it('할일 그룹 등록', async () => {
           const createTodoGroupDto: CreateTodoGroupDto = getCreateTodoGroupData();
           const insertResult: TodoGroup = await todoGroupService.create(savedMemberInfo, createTodoGroupDto);

           expect(insertResult instanceof TodoGroup).toBeTruthy();

           createdTodoGroup = insertResult;
       });
    });

    describe('update()', () => {
       it('할일 그룹 수정', async () => {
           const updateTodoGroupDto: UpdateTodoGroupDto = getCreateTodoGroupData();
           const updateResult: UpdateResult = await todoGroupService.update(savedMemberInfo, createdTodoGroup, updateTodoGroupDto);

           expect(updateResult.affected === 1).toBeTruthy();
       });
    });

    describe('delete()', () => {
       it('할일 그룹 등록', async () => {
           const deleteResult: DeleteResult = await todoGroupService.delete(savedMemberInfo, createdTodoGroup);

           expect(deleteResult.affected === 1).toBeTruthy();
       });
    });

});