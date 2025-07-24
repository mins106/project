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
      <div v-if="checkMessage" class="message-text">{{ checkMessage }}</div>

      <!-- 비밀번호 -->
      <div class="input-row">
        <label>비밀번호</label>
        <input type="password" v-model="password" />
      </div>

      <!-- 비밀번호 확인 -->
      <div class="input-row">
        <label>확인</label>
        <input type="password" v-model="confirmPassword" />
      </div>

      <!-- 에러 메시지 -->
      <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

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
      studentId: "",
      name: "",
      userId: "",
      password: "",
      confirmPassword: "",
      errorMessage: "",
      checkMessage: "",
    };
  },
  methods: {
    async checkDuplicate() {
      if (!this.userId) {
        this.checkMessage = "아이디를 입력하세요.";
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/api/check-id?userId=${this.userId}`
        );
        await res.json();

        if (res.status === 409) {
          this.checkMessage = "이미 사용 중인 아이디입니다.";
        } else {
          this.checkMessage = "사용 가능한 아이디입니다!";
        }
      } catch (err) {
        this.checkMessage = "서버 오류 발생";
      }
    },

    async signUp() {
      this.errorMessage = "";
      this.checkMessage = "";

      if (
        !this.studentId ||
        !this.name ||
        !this.userId ||
        !this.password ||
        !this.confirmPassword
      ) {
        this.errorMessage = "모든 항목을 입력해주세요.";
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.errorMessage = "비밀번호가 일치하지 않습니다.";
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: this.studentId,
            name: this.name,
            userId: this.userId,
            password: this.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.errorMessage = data.message || "회원가입 실패";
          return;
        }

        alert("회원가입 성공!");
        this.$router.push("/login");
      } catch (err) {
        this.errorMessage = "서버 연결 실패";
      }
    },
  },
};
</script>

<style scoped>
.signup-container {
  max-width: 400px;
  margin: 60px auto;
  padding: 20px;
  position: relative;
}

.back-arrow {
  position: absolute;
  top: 20px;
  left: 10px;
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

.message-text {
  font-size: 13px;
  margin-top: -12px;
  margin-bottom: 8px;
  color: #333;
}

.error-text {
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 12px;
  color: red;
}
</style>
