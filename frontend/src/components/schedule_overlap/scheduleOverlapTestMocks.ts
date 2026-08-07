import { vi } from "vitest"
import type * as UtilsModule from "@/utils"

export const viewportWidth = { value: 1024 }

export const putMock = vi.fn()
export const refreshAuthUserMock = vi.fn()
export const showInfoMock = vi.fn()
export const showErrorMock = vi.fn()

vi.mock("vuetify", () => ({
  useDisplay: () => ({
    width: viewportWidth,
  }),
}))

vi.mock("@/utils", async () => {
  const actual = await vi.importActual<typeof UtilsModule>("@/utils")
  return {
    ...actual,
    put: putMock,
  }
})

vi.mock("@/stores/main", () => ({
  useMainStore: () => ({
    authUser: null,
    refreshAuthUser: refreshAuthUserMock,
    showInfo: showInfoMock,
    showError: showErrorMock,
  }),
}))

vi.mock("@/plugins/posthog", () => ({
  posthog: {
    capture: vi.fn(),
  },
}))

export const resetScheduleOverlapMocks = () => {
  viewportWidth.value = 1024
  putMock.mockReset()
  putMock.mockResolvedValue(undefined)
  refreshAuthUserMock.mockReset()
  showInfoMock.mockReset()
  showErrorMock.mockReset()
}
