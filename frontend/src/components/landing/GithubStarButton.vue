<template>
  <span ref="buttonMount" class="landing-github-star-button">
    <a
      ref="buttonAnchor"
      :href="gitHubRepoUrl"
      data-show-count="true"
      aria-label="Star timeful.app on GitHub"
    >
      Star
    </a>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue"
import { render } from "github-buttons"
import { gitHubRepoUrl } from "@/utils/github"

defineOptions({ name: "GithubStarButton" })

const buttonMount = ref<HTMLSpanElement | null>(null)
const buttonAnchor = ref<HTMLAnchorElement | null>(null)

onMounted(() => {
  void nextTick(() => {
    const mount = buttonMount.value
    const anchor = buttonAnchor.value
    if (!mount || !anchor) {
      return
    }

    render(anchor, (button) => {
      mount.replaceChildren(button)
    })
  })
})
</script>

<style scoped>
.landing-github-star-button {
  display: flex;
  align-items: center;
  height: 20px;
  line-height: 0;
}

.landing-github-star-button :deep(> *) {
  display: block;
}
</style>
