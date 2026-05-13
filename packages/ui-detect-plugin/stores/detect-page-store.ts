import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface DetectPageType {
  activeStep: number
  /** 已完成的步骤集合（1-6） */
  completedSteps: number[]
  /** 冻结的目标根节点 ID，进入预处理页时写入，后续所有操作围绕它 */
  targetRootNodeId: string
  /** 冻结的目标根节点名称，仅用于展示 */
  targetRootNodeName: string
  /** 本次会话是否已创建过备份 */
  backupCreated: boolean
  updateStep: (step: number) => void
  markStepDone: (step: number) => void
  reset: () => void
  freezeTarget: (id: string, name: string) => void
  setBackupCreated: () => void
}

export const useDetectPageStore = create(immer<DetectPageType>(set => ({
  activeStep: 1,
  completedSteps: [],
  targetRootNodeId: '',
  targetRootNodeName: '',
  backupCreated: false,
  updateStep: step => set((prev) => { prev.activeStep = step }),
  markStepDone: step => set((prev) => {
    if (!prev.completedSteps.includes(step))
      prev.completedSteps.push(step)
    if (prev.activeStep === step)
      prev.activeStep = step + 1
  }),
  reset: () => set((prev) => {
    prev.activeStep = 1
    prev.completedSteps = []
    prev.targetRootNodeId = ''
    prev.targetRootNodeName = ''
    prev.backupCreated = false
  }),
  freezeTarget: (id, name) => set((prev) => {
    if (!prev.targetRootNodeId) {
      prev.targetRootNodeId = id
      prev.targetRootNodeName = name
    }
  }),
  setBackupCreated: () => set((prev) => { prev.backupCreated = true }),
})))
