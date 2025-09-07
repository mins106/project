<template>
  <div class="uploader">
    <!-- 상단 컨트롤 -->
    <div class="controls">
      <button type="button" class="btn" @click="openPicker">
        <span class="icon">📷</span>
        사진 추가
      </button>
      <span class="muted">최대 {{ maxCount }}장 · 파일당 {{ maxMB }}MB</span>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onPick"
      />
    </div>

    <!-- 드롭영역 -->
    <div
      class="drop"
      :class="{ over: isOver }"
      @dragenter.prevent="isOver = true"
      @dragover.prevent
      @dragleave.prevent="isOver = false"
      @drop.prevent="(isOver = false), onDrop($event)"
    >
      <div class="drop-inner">
        <div class="drop-icon">🖼️</div>
        <div class="drop-text">
          여기로 <b>드래그&드롭</b>하거나
          <b class="link" @click="openPicker">사진 추가</b> 버튼을 누르세요
        </div>
        <div class="drop-sub">JPG/PNG/GIF · 파일당 {{ maxMB }}MB</div>
      </div>
    </div>

    <!-- 미리보기 그리드 -->
    <div v-if="files.length" class="grid">
      <div v-for="(f, idx) in files" :key="f.id" class="item">
        <img :src="f.preview" alt="preview" loading="lazy" />
        <div class="meta">{{ prettySize(f.file.size) }}</div>

        <div class="toolbar">
          <button
            type="button"
            title="위로"
            @click.stop="move(idx, -1)"
            :disabled="idx === 0"
          >
            ▲
          </button>
          <button
            type="button"
            title="아래로"
            @click.stop="move(idx, 1)"
            :disabled="idx === files.length - 1"
          >
            ▼
          </button>
          <button
            type="button"
            class="danger"
            title="삭제"
            @click.stop="removeAt(idx)"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageUploader",
  props: {
    modelValue: { type: Array, default: () => [] }, // File[]
    maxCount: { type: Number, default: 10 },
    maxMB: { type: Number, default: 8 },
  },
  data() {
    return {
      files: [], // [{ id, file: File, preview }]
      isOver: false,
    };
  },
  methods: {
    openPicker() {
      this.$refs.fileInput?.click();
    },
    onPick(e) {
      this.handleFiles(e.target.files);
      e.target.value = "";
    },
    onDrop(e) {
      this.handleFiles(e.dataTransfer?.files);
    },
    handleFiles(fileList) {
      const maxBytes = this.maxMB * 1024 * 1024;
      const incoming = Array.from(fileList || []);
      for (const f of incoming) {
        if (!f.type?.startsWith?.("image/")) continue;
        if (f.size > maxBytes) {
          alert(`파일이 너무 커요: ${f.name}`);
          continue;
        }
        if (this.files.length >= this.maxCount) {
          alert("최대 개수를 초과했어요.");
          break;
        }
        const id = self.crypto?.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
        const preview = URL.createObjectURL(f);
        this.files.push({ id, file: f, preview });
      }
      this.emitFiles();
    },
    removeAt(idx) {
      const [x] = this.files.splice(idx, 1);
      if (x?.preview) URL.revokeObjectURL(x.preview);
      this.emitFiles();
    },
    move(idx, dir) {
      const ni = idx + dir;
      if (ni < 0 || ni >= this.files.length) return;
      const tmp = this.files[idx];
      this.files.splice(idx, 1, this.files[ni]);
      this.files.splice(ni, 1, tmp);
      this.emitFiles();
    },
    prettySize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / 1024 / 1024).toFixed(2) + " MB";
    },
    emitFiles() {
      this.$emit(
        "update:modelValue",
        this.files.map((x) => x.file)
      );
    },
  },
  beforeUnmount() {
    this.files.forEach((x) => x?.preview && URL.revokeObjectURL(x.preview));
  },
};
</script>

<style scoped>
.uploader {
  display: grid;
  gap: 12px;
}

/* 상단 컨트롤 */
.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #cfd8ff;
  background: #eff1ff;
  color: #2f2f43;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}

.btn:hover {
  background: #e7eaff;
}

.icon {
  font-size: 14px;
}

.muted {
  color: #748092;
  font-size: 12px;
}

.hidden {
  display: none;
}

/* 드롭존 */
.drop {
  border: 2px dashed #d6d9e0;
  border-radius: 12px;
  padding: 22px;
  background: #fafbff;
  transition: 0.15s ease;
}

.drop.over {
  border-color: #7c8cff;
  background: #f2f4ff;
}

.drop-inner {
  display: grid;
  place-items: center;
  gap: 6px;
  text-align: center;
  color: #445;
}

.drop-icon {
  font-size: 28px;
}

.drop-text {
  font-size: 14px;
}

.drop-text .link {
  color: #5a2fc9;
  cursor: pointer;
  text-decoration: underline;
}

.drop-sub {
  font-size: 12px;
  color: #8590a2;
}

/* 프리뷰 그리드 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.item {
  position: relative;
  border: 1px solid #e7e8ee;
  border-radius: 12px;
  overflow: hidden;
  background: #f7f8fc;
}

.item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
  background: #eef1f5;
}

.meta {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #0007;
  color: #fff;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
}

.toolbar {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.45));
}

.toolbar button {
  border: none;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  color: #fff;
  background: #0008;
  cursor: pointer;
}

.toolbar button:hover {
  background: #000c;
}

.toolbar .danger {
  background: #e63946cc;
}

.toolbar .danger:hover {
  background: #e63946;
}
</style>
