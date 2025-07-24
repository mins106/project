<template>
    <div class="signup-container">
        <!-- 뒤로가기 -->
        <div class="back-arrow" @click="$router.go(-1)">←</div>

        <h1 class="title">회원가입</h1>

        <div class="form-wrapper">
            <!-- 학번 -->
            <div class="input-row">
                <label>학번</label>
                <input type="text" v-model="studentId" />
            </div>

            <!-- 이름 -->
            <div class="input-row">
                <label>이름</label>
                <input type="text" v-model="name" />
            </div>

            <!-- 아이디 + 중복확인 -->
            <div class="input-row id-check-row">
                <label>아이디</label>
                <input type="text" v-model="userId" />
                <button class="check-btn" @click="checkDuplicate">중복 확인</button>
            </div>

            <!-- 비밀번호 -->
            <div class="input-row">
                <label>비밀번호</label>
                <input type="password" v-model="password" />
            </div>

            <!-- 회원가입 버튼 -->
            <button class="submit-btn" @click="signUp">회원가입</button>
        </div>
    </div>
</template>

<script>
export default {
    name: "SignUpPage",
    data() {
        return {
            studentId: '',
            name: '',
            userId: '',
            password: '',
        };
    },
    methods: {
        checkDuplicate() {
            // TODO: 서버로 아이디 중복 체크 요청
            alert("중복 확인 완료 (예시)");
        },
        signUp() {
            // TODO: 실제 회원가입 처리
            alert("회원가입 완료 (예시)");
            this.$router.push("/login");
        },
    },
};
</script>

<style scoped>
.signup-container {
    max-width: 400px;
    margin: 60px auto;
    padding: 20px;
}

.back-arrow {
    position: absolute;
    top: 30px;
    left: 20px;
    font-size: 24px;
    cursor: pointer;
}

.title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 30px;
    text-align: center;
}

.form-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.input-row {
    display: flex;
    border: 1px solid #ccc;
    border-radius: 12px;
    overflow: hidden;
}

.input-row label {
    background-color: white;
    padding: 12px;
    width: 80px;
    font-weight: bold;
    font-size: 15px;
    border-right: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
}

.input-row input {
    flex: 1;
    padding: 12px;
    border: none;
    outline: none;
    font-size: 15px;
}

.id-check-row {
    position: relative;
}

.id-check-row input {
    border-right: 1px solid #ccc;
}

.check-btn {
    background-color: white;
    border: none;
    border-left: 1px solid #ccc;
    padding: 12px 16px;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
}

.submit-btn {
    width: 100%;
    padding: 14px;
    background-color: #6a3acb;
    color: white;
    font-weight: bold;
    font-size: 16px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
}
</style>