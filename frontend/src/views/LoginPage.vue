<template>
  <div class="login-container">
    <!-- 뒤로가기 화살표 -->
    <div class="back-arrow" @click="$router.go(-1)">←</div>

    <h1 class="login-title">LOGIN</h1>

    <div class="form-wrapper">
      <!-- 아이디 입력 -->
      <div class="input-group">
        <span class="input-icon">👤</span>
        <input
          type="text"
          v-model="userId"
          placeholder="아이디를 입력하세요."
        />
      </div>

      <!-- 비밀번호 입력 -->
      <div class="input-group">
        <span class="input-icon">🔒</span>
        <input
          type="password"
          v-model="password"
          placeholder="비밀번호를 입력하세요."
        />
      </div>

      <!-- 로그인 버튼 -->
      <button class="btn login-btn" @click="login">로그인</button>

      <!-- 회원가입 버튼 -->
      <button class="btn signup-btn" @click="$router.push('/signup')">
        회원가입
      </button>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>
  </div>
</template>

<script>
export default {
  name: "LoginPage",
  data() {
    return {
      userId: "",
      password: "",
      errorMessage: "",
    };
  },
  methods: {
    async login() {
      this.errorMessage = "";

      if (!this.userId || !this.password) {
        this.errorMessage = "아이디와 비밀번호를 모두 입력해주세요.";
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: this.userId,
            password: this.password,
          }),
        });

        const data = await res.json();
        console.log("로그인 응답:", data);

        if (!res.ok) {
          this.errorMessage = data.message || "로그인 실패";
          return;
        }

        // ✅ 사용자 정보 저장
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: data.user.name,
            studentId: data.user.userId,
          })
        );

        alert(`${data.user.name}님 환영합니다!`);
        this.$router.push("/"); // 홈으로 이동
      } catch (err) {
        this.errorMessage = "서버 연결에 실패했습니다.";
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
}

.back-arrow {
  position: absolute;
  top: 30px;
  left: 20px;
  font-size: 24px;
  cursor: pointer;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

.input-group {
  display: flex;
  align-items: center;
  background-color: #f3f3f3;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.input-icon {
  margin-right: 10px;
  font-size: 18px;
}

.input-group input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 16px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  cursor: pointer;
}

.login-btn {
  background-color: #4c5bd4;
}

.signup-btn {
  background-color: #6a3acb;
}

.error-text {
  color: red;
  margin-top: 10px;
  font-size: 14px;
}
</style>
