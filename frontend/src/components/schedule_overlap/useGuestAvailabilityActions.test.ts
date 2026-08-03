import { computed, nextTick, ref } from "vue"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  ParsedResponse,
} from "@/composables/schedule_overlap/types"
import { useGuestAvailabilityActions } from "./useGuestAvailabilityActions"

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))

vi.mock("@/utils", () => ({ post: postMock }))

const response = (
  userId: string,
  options: Partial<ParsedResponse> = {}
): ParsedResponse => ({
  user: { _id: userId },
  availability: {} as ParsedResponse["availability"],
  guest: true,
  ...options,
})

const mountActions = ({
  currentGuestId = "guest-1",
  responses = { "guest-1": { name: "guest-1" } },
  parsedResponses = { "guest-1": response("guest-1") },
  ownedLookupKeys = ["guest-1"],
  guestOwnership,
  authenticated = false,
}: {
  currentGuestId?: string
  responses?: Record<string, { name?: string; guestId?: string }>
  parsedResponses?: Record<string, ParsedResponse>
  ownedLookupKeys?: string[]
  guestOwnership?: {
    name?: string
    guestId?: string
    guestEditToken?: string
    guestEditPolicy?: "protected" | "open"
    guestOwnershipMode?: "legacy" | "token"
  }
  authenticated?: boolean
} = {}) => {
  const curGuestId = ref(currentGuestId)
  const parsed = ref(parsedResponses)
  const newGuestName = ref("")
  const editGuestNameDialog = ref(false)
  const selected = vi.fn()
  const removed = vi.fn()
  const setOwnership = vi.fn()
  const startEditing = vi.fn()
  const stopEditing = vi.fn()
  const populateUserAvailability = vi.fn()
  const setCurGuestId = vi.fn((value: string) => { curGuestId.value = value })
  const guestAvailabilityDeleted = vi.fn()
  const refreshEvent = vi.fn()
  const showInfo = vi.fn()
  const showError = vi.fn()
  const actions = useGuestAvailabilityActions({
    isAuthenticated: computed(() => authenticated),
    event: computed(() => ({ _id: "evt-1", responses })),
    curGuestId: computed(() => curGuestId.value),
    parsedResponses: computed(() => parsed.value),
    ownedGuestResponseLookupKeys: computed(() => new Set(ownedLookupKeys)),
    guestOwnership: computed(() => guestOwnership),
    guestResponseLookupKey: computed(() =>
      guestOwnership?.guestId ?? guestOwnership?.name
    ),
    newGuestName,
    editGuestNameDialog,
    selectGuestOwnership: selected,
    removeGuestOwnership: removed,
    getOwnedGuestOwnership: vi.fn(() => guestOwnership),
    setGuestOwnership: setOwnership,
    startEditing,
    stopEditing,
    populateUserAvailability,
    setCurGuestId,
    guestAvailabilityDeleted,
    refreshEvent,
    showInfo,
    showError,
  })

  return {
    actions,
    curGuestId,
    newGuestName,
    editGuestNameDialog,
    selected,
    removed,
    setOwnership,
    startEditing,
    stopEditing,
    populateUserAvailability,
    setCurGuestId,
    guestAvailabilityDeleted,
    refreshEvent,
    showInfo,
    showError,
  }
}

describe("useGuestAvailabilityActions", () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it("edits owned token guests and leaves protected unowned guests untouched", async () => {
    const guest = response("guest-response", {
      guestId: "guest-token",
      guestOwnershipMode: "token",
      guestEditPolicy: "protected",
    })
    const owned = mountActions({
      currentGuestId: "guest-response",
      parsedResponses: { "guest-response": guest },
      ownedLookupKeys: ["guest-token"],
    })

    owned.actions.editGuestAvailability("guest-response")
    await nextTick()

    expect(owned.selected).toHaveBeenCalledWith("guest-token")
    expect(owned.startEditing).toHaveBeenCalledOnce()
    expect(owned.populateUserAvailability).toHaveBeenCalledWith("guest-response")
    expect(owned.setCurGuestId).toHaveBeenCalledWith("guest-response")

    const unowned = mountActions({
      parsedResponses: { "guest-response": guest },
      ownedLookupKeys: [],
    })
    unowned.actions.editGuestAvailability("guest-response")

    expect(unowned.startEditing).not.toHaveBeenCalled()
  })

  it("uses the response ownership identity when deleting a selected guest", () => {
    const guest = response("guest-response", {
      guestId: "guest-token",
      guestOwnershipMode: "token",
    })
    const harness = mountActions({
      currentGuestId: "guest-response",
      parsedResponses: { "guest-response": guest },
    })

    harness.actions.handleGuestAvailabilityDeleted("guest-response")

    expect(harness.removed).toHaveBeenCalledWith("guest-token")
    expect(harness.setCurGuestId).toHaveBeenCalledWith("")
    expect(harness.stopEditing).toHaveBeenCalledOnce()
    expect(harness.guestAvailabilityDeleted).toHaveBeenCalledWith("guest-response")
  })

  it("keeps token selection stable when renaming a token guest", async () => {
    postMock.mockResolvedValue({
      guestCredentials: {
        guestId: "guest-token",
        guestEditToken: "new-token",
        guestEditPolicy: "protected",
        guestOwnershipMode: "token",
      },
    })
    const harness = mountActions({
      currentGuestId: "guest-token",
      responses: {
        "guest-token": { name: "guest-1", guestId: "guest-token" },
      },
      guestOwnership: {
        name: "guest-1",
        guestId: "guest-token",
        guestEditToken: "edit-token",
        guestEditPolicy: "protected",
        guestOwnershipMode: "token",
      },
    })
    harness.newGuestName.value = "guest-2"

    await harness.actions.saveGuestName()

    expect(postMock).toHaveBeenCalledWith(
      "/events/evt-1/rename-user?guestId=guest-token",
      expect.objectContaining({
        oldName: "guest-1",
        newName: "guest-2",
        guestId: "guest-token",
        guestEditToken: "edit-token",
      })
    )
    expect(harness.setOwnership).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: "guest-token", name: "guest-2" })
    )
    expect(harness.setCurGuestId).toHaveBeenCalledWith("guest-token")
    expect(harness.refreshEvent).toHaveBeenCalledOnce()
  })

  it("updates legacy selection to the renamed name", async () => {
    postMock.mockResolvedValue({})
    const harness = mountActions({
      responses: { "guest-1": { name: "guest-1" } },
      guestOwnership: { name: "guest-1", guestOwnershipMode: "legacy" },
    })
    harness.newGuestName.value = "guest-2"

    await harness.actions.saveGuestName()

    expect(postMock).toHaveBeenCalledWith(
      "/events/evt-1/rename-user?guestName=guest-1",
      expect.objectContaining({ oldName: "guest-1", newName: "guest-2" })
    )
    expect(harness.setCurGuestId).toHaveBeenCalledWith("guest-2")
  })
})
