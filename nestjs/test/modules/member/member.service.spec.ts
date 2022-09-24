import {Member} from "../../../src/modules/member/entities/member.entity";
import {Test, TestingModule} from "@nestjs/testing";
import {getRepositoryToken, TypeOrmModule} from "@nestjs/typeorm";
import {staticPath, typeOrmOptions} from "../../../config/config";
import {
    getCreateMemberData, getLoginMemberDto, getProfileImageData, getUpdateMemberDto,
    loginHeader,
} from "./member";
import {MemberService} from "../../../src/modules/member/member.service";
import {MemberRepository} from "../../../src/modules/member/member.repository";
import {TokenRepository} from "../../../src/modules/member/token/token.repository";
import {TodoGroupRepository} from "../../../src/modules/todoGroup/todoGroup.repository";
import {LoginMemberDto} from "../../../src/modules/member/dto/login-member.dto";
import {CreateMemberDto} from "../../../src/modules/member/dto/create-member-dto";
import {createRandomString} from "../../../libs/utils";
import {UpdateMemberDto} from "../../../src/modules/member/dto/update-member.dto";
import {FileType} from "../../../src/common/type/type";
import Buffer from "buffer";
import {existsSync, readFileSync} from "fs";
import {DeleteResult} from "typeorm";

describe('Member Service', () => {
    let memberService: MemberService;
    let savedMemberInfo: Member;
    let createdMemberInfo: Member;
    let profileImgKey: string;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(typeOrmOptions),
                TypeOrmModule.forFeature([
                    MemberRepository,
                    TokenRepository,
                    TodoGroupRepository
                ])
            ],
            providers: [
                MemberService,
                {
                    provide: getRepositoryToken(Member),
                    useValue: MemberService
                }
            ]
        }).compile()

        memberService = module.get<MemberService>(MemberService)
    });

    describe('login()', () => {
        it('로그인', async () => {
            const loginMemberDto: LoginMemberDto = getLoginMemberDto();

            savedMemberInfo = await memberService.login(loginMemberDto, loginHeader);

            expect(savedMemberInfo instanceof Member).toBeTruthy();
        });
    });

    describe('signUp()', () => {
        it('회원가입', async () => {
            const createMemberDto: CreateMemberDto = getCreateMemberData(true);

            createdMemberInfo = await memberService.signUp(createMemberDto);

            expect(createdMemberInfo instanceof Member).toBeTruthy();
        });
    });

    describe('duplicateCheck()', () => {
        it('중복 체크', async () => {
            const checkKeyList = ['id', 'nickname', 'email'];

            const randomString = createRandomString(12);

            for(const key of checkKeyList){
                const dupCheckFalse = await memberService.duplicateCheck(key, savedMemberInfo[key]);
                expect(!dupCheckFalse).toBeTruthy();

                const dupCheckTrue = await memberService.duplicateCheck(key, randomString);
                expect(!dupCheckTrue).toBeFalsy()
            }
        });
    });

    describe('updateMember()', () => {
        it('멤버 수정', async () => {
            const updateMemberData: UpdateMemberDto = getUpdateMemberDto();

            await memberService.updateMember(updateMemberData, savedMemberInfo);
        });
    });

    describe('signOut()', () => {
        it('회원 탈퇴', async () => {
            const deleteResult: DeleteResult = await memberService.signOut(createdMemberInfo);

            expect(deleteResult.affected).toBe(1);
        });
    });

    describe('updateImg()', () => {
        it('프로필 사진 수정', async () => {
            const imgData: FileType = getProfileImageData();

            profileImgKey = await memberService.updateImg(imgData, savedMemberInfo);

            const fileBuffer: Buffer = readFileSync(staticPath + profileImgKey);

            expect(fileBuffer.buffer instanceof ArrayBuffer).toBeTruthy();
        });
    });

    describe('deleteUpdate()', () => {
        it('프로필 사진 삭제', async () => {
            const profileImgPath = staticPath + profileImgKey;

            savedMemberInfo.dataMigration(
                {profileImgKey: profileImgKey}
            );

            expect(existsSync(profileImgPath)).toBeTruthy();

            await memberService.deleteImg(savedMemberInfo);

            expect(existsSync(profileImgPath)).toBeFalsy();
        });
    });

});