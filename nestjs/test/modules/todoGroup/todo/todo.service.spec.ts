import {TodoGroup} from "../../../../src/modules/todoGroup/entities/todoGroup.entity";
import {getSavedTodoGroup} from "../todoGroup";
import {Todo} from "../../../../src/modules/todoGroup/todo/entities/todo.entity";
import {getCreateTodoData, getSavedTodo} from "./todo";
import {TodoService} from "../../../../src/modules/todoGroup/todo/todo.service";
import {Test, TestingModule} from "@nestjs/testing";
import {getRepositoryToken, TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmOptions} from "../../../../config/config";
import {TodoRepository} from "../../../../src/modules/todoGroup/todo/todo.repository";
import {SelectListResponseType} from "../../../../src/common/type/type";
import {CreateTodoDto} from "../../../../src/modules/todoGroup/todo/dto/create-todo-dto";
import {UpdateTodoDto} from "../../../../src/modules/todoGroup/todo/dto/update-todo-dto";
import {DeleteResult, UpdateResult} from "typeorm";

describe('Todo Service', () => {
    const savedTodoGroupInfo: TodoGroup = getSavedTodoGroup();
    const savedTodoInfo: Todo = getSavedTodo();
    let todoService: TodoService;
    let createdTodoInfo: Todo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(typeOrmOptions),
                TypeOrmModule.forFeature([
                    TodoRepository,
                ])
            ],
            providers: [
                TodoService,
            ]
        }).compile();

        todoService = module.get<TodoService>(TodoService);
    });

    describe('selectOne()', () => {
        it('할일 상세 조회', async () => {
            const todo: Todo = await todoService.selectOne(savedTodoGroupInfo, savedTodoInfo.idx);

            expect(todo instanceof Todo).toBeTruthy();
        });
    });

    describe('selectList()', () => {
        it('할일 리스트 조회', async () => {
            const todoList: SelectListResponseType<Todo>
                = await todoService.selectList(savedTodoGroupInfo, 1, 10);

            expect(todoList.items.every(t => t instanceof Todo)).toBeTruthy();
        });
    });

    describe('create()', () => {
        it('할일 등록', async () => {
            const createTodoDto: CreateTodoDto = getCreateTodoData();
            const insertResult: Todo = await todoService.create(savedTodoGroupInfo, createTodoDto);

            expect(insertResult instanceof Todo).toBeTruthy();

            createdTodoInfo = insertResult;
        });
    });

    describe('update()', () => {
        it('할일 수정', async () => {
            const updateTodoDto: UpdateTodoDto = {
                content: "수정된 할일 내용",
                complete: true
            };

            const updateResult: UpdateResult = await todoService.update(createdTodoInfo, updateTodoDto);

            expect(updateResult.affected === 1).toBeTruthy();
        });
    });

    describe('delete()', () => {
        it('할일 등록', async () => {
            const deleteResult: DeleteResult = await todoService.delete(createdTodoInfo);

            expect(deleteResult.affected === 1).toBeTruthy();
        });
    });

});