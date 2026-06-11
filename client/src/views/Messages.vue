<template>
  <div class="messages-page">
    <div class="page-header">
      <div class="container">
        <h1>📬 消息中心</h1>
        <p>管理你的借用申请、练琴邀约和互动消息</p>
      </div>
    </div>
    
    <div class="container">
      <el-tabs v-model="activeTab" type="card" class="msg-tabs">
        <el-tab-pane>
          <template #label>
            <el-icon><Goods /></el-icon>
            借用消息
            <el-badge v-if="pendingBorrowsAsOwner.length || pendingBorrowsAsBorrower.length" :value="pendingBorrowsAsOwner.length + pendingBorrowsAsBorrower.length" class="tab-badge" />
          </template>
          
          <div class="section">
            <h3>收到的借用申请（作为主人）</h3>
            <div v-if="borrowsAsOwner.length" class="msg-list">
              <div v-for="b in borrowsAsOwner" :key="b.id" class="msg-item card">
                <div class="msg-avatar">
                  <img :src="b.borrower?.avatar" class="avatar-md" />
                </div>
                <div class="msg-content">
                  <div class="msg-title">
                    <b>{{ b.borrower?.username }}</b> 申请借用您的
                    <router-link :to="`/instruments/${b.instrumentId}`">{{ b.instrument?.name }}</router-link>
                    <span class="badge" :class="statusClass(b.status)">{{ statusText(b.status) }}</span>
                  </div>
                  <div class="msg-meta">
                    <span><el-icon><Calendar /></el-icon> {{ b.startDate }} 至 {{ b.endDate }}</span>
                    <span><el-icon><Wallet /></el-icon> 租金 ¥{{ b.feeTotal }} + 押金 ¥{{ b.depositPaid }}</span>
                  </div>
                  <p class="msg-body" v-if="b.purpose">借用目的：{{ b.purpose }}</p>
                  <div class="msg-actions" v-if="b.status === 'pending'">
                    <el-button type="success" size="small" @click="updateBorrow(b, 'confirmed')">
                      <el-icon><CircleCheck /></el-icon>
                      同意借用
                    </el-button>
                    <el-button type="danger" size="small" @click="updateBorrow(b, 'rejected')">
                      <el-icon><CircleClose /></el-icon>
                      拒绝
                    </el-button>
                  </div>
                  <div class="msg-actions" v-if="b.status === 'borrowing'">
                    <el-button type="primary" size="small" @click="confirmReturn(b)">
                      <el-icon><CircleCheck /></el-icon>
                      确认归还
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small"><el-icon><Goods /></el-icon><p>暂无借用申请</p></div>
          </div>
          
          <div class="section">
            <h3>我的借用申请（作为借用人）</h3>
            <div v-if="borrowsAsBorrower.length" class="msg-list">
              <div v-for="b in borrowsAsBorrower" :key="b.id" class="msg-item card">
                <div class="msg-avatar">
                  <img :src="b.instrument?.image" class="inst-thumb" />
                </div>
                <div class="msg-content">
                  <div class="msg-title">
                    您申请借用
                    <router-link :to="`/instruments/${b.instrumentId}`">{{ b.instrument?.name }}</router-link>
                    （主人：{{ b.owner?.username }}）
                    <span class="badge" :class="statusClass(b.status)">{{ statusText(b.status) }}</span>
                  </div>
                  <div class="msg-meta">
                    <span><el-icon><Calendar /></el-icon> {{ b.startDate }} 至 {{ b.endDate }}</span>
                    <span><el-icon><Wallet /></el-icon> 租金 ¥{{ b.feeTotal }} + 押金 ¥{{ b.depositPaid }}</span>
                  </div>
                  <div class="msg-actions" v-if="b.status === 'returned' && !b.reviewed">
                    <el-button type="primary" size="small" @click="showReviewDialog(b, 'borrow')">
                      <el-icon><Edit /></el-icon>
                      评价本次借用
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small"><el-icon><Goods /></el-icon><p>暂无借用记录</p></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane>
          <template #label>
            <el-icon><User /></el-icon>
            邀约消息
            <el-badge v-if="pendingInvitationsAsInvitee.length" :value="pendingInvitationsAsInvitee.length" class="tab-badge" />
          </template>
          
          <div class="section">
            <h3>收到的练琴邀约</h3>
            <div v-if="invitationsAsInvitee.length" class="msg-list">
              <div v-for="inv in invitationsAsInvitee" :key="inv.id" class="msg-item card">
                <div class="msg-avatar">
                  <img :src="inv.inviter?.avatar" class="avatar-md" />
                </div>
                <div class="msg-content">
                  <div class="msg-title">
                    <b>{{ inv.inviter?.username }}</b> 邀请你一起练琴
                    <span class="badge" :class="statusClass(inv.status)">{{ statusText(inv.status) }}</span>
                  </div>
                  <div class="msg-meta">
                    <span><el-icon><MagicStick /></el-icon> {{ inv.instrument }}</span>
                    <span><el-icon><Notebook /></el-icon> {{ inv.piece || '待定' }}</span>
                    <span><el-icon><Calendar /></el-icon> {{ inv.meetTime }}</span>
                    <span><el-icon><Location /></el-icon> {{ inv.location }}</span>
                  </div>
                  <p class="msg-body" v-if="inv.message">留言：{{ inv.message }}</p>
                  <div class="msg-actions" v-if="inv.status === 'pending'">
                    <el-button type="success" size="small" @click="updateInvitation(inv, 'accepted')">
                      <el-icon><CircleCheck /></el-icon>
                      接受邀约
                    </el-button>
                    <el-button type="danger" size="small" @click="updateInvitation(inv, 'rejected')">
                      <el-icon><CircleClose /></el-icon>
                      婉拒
                    </el-button>
                  </div>
                  <div class="msg-actions" v-if="inv.status === 'accepted' && !inv.reviewed">
                    <el-button type="primary" size="small" @click="showReviewDialog(inv, 'invitation')">
                      <el-icon><Edit /></el-icon>
                      评价TA
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small"><el-icon><User /></el-icon><p>暂无邀约</p></div>
          </div>
          
          <div class="section">
            <h3>我发出的邀约</h3>
            <div v-if="invitationsAsInviter.length" class="msg-list">
              <div v-for="inv in invitationsAsInviter" :key="inv.id" class="msg-item card">
                <div class="msg-avatar">
                  <img :src="inv.invitee?.avatar" class="avatar-md" />
                </div>
                <div class="msg-content">
                  <div class="msg-title">
                    你邀约 <b>{{ inv.invitee?.username }}</b> 练琴
                    <span class="badge" :class="statusClass(inv.status)">{{ statusText(inv.status) }}</span>
                  </div>
                  <div class="msg-meta">
                    <span><el-icon><MagicStick /></el-icon> {{ inv.instrument }}</span>
                    <span><el-icon><Calendar /></el-icon> {{ inv.meetTime }}</span>
                    <span><el-icon><Location /></el-icon> {{ inv.location }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small"><el-icon><User /></el-icon><p>暂无发出的邀约</p></div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <el-dialog v-model="showReview" title="评价" width="500px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" show-score text-color="#ff9900" />
        </el-form-item>
        <el-form-item label="场景">
          <el-tag>{{ reviewForm.context }}</el-tag>
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="reviewForm.content" type="textarea" :rows="4" placeholder="说说你的感受..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { borrowApi, invitationApi, reviewApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Goods, User, Calendar, Wallet, CircleCheck, CircleClose, MagicStick, Notebook, Location, Edit } from '@element-plus/icons-vue'

const userStore = useUserStore()

const activeTab = ref('0')
const borrows = ref([])
const invitations = ref([])
const showReview = ref(false)
const submitting = ref(false)

const currentTarget = ref(null)

const reviewForm = reactive({
  rating: 5,
  context: '',
  content: ''
})

const statusMap = {
  pending: { text: '待处理', class: 'badge-warning' },
  confirmed: { text: '已确认', class: 'badge-primary' },
  borrowing: { text: '借用中', class: 'badge-primary' },
  returned: { text: '已归还', class: 'badge-success' },
  rejected: { text: '已拒绝', class: 'badge-danger' },
  accepted: { text: '已接受', class: 'badge-success' },
  completed: { text: '已完成', class: 'badge-success' }
}

const statusText = (s) => statusMap[s]?.text || s
const statusClass = (s) => statusMap[s]?.class || 'badge-primary'

const borrowsAsOwner = computed(() => borrows.value.filter(b => b.ownerId === userStore.userId))
const borrowsAsBorrower = computed(() => borrows.value.filter(b => b.borrowerId === userStore.userId))
const pendingBorrowsAsOwner = computed(() => borrowsAsOwner.value.filter(b => b.status === 'pending'))
const pendingBorrowsAsBorrower = computed(() => borrowsAsBorrower.value.filter(b => b.status === 'pending'))

const invitationsAsInvitee = computed(() => invitations.value.filter(i => i.inviteeId === userStore.userId))
const invitationsAsInviter = computed(() => invitations.value.filter(i => i.inviterId === userStore.userId))
const pendingInvitationsAsInvitee = computed(() => invitationsAsInvitee.value.filter(i => i.status === 'pending'))

onMounted(async () => {
  await loadAll()
})

const loadAll = async () => {
  try {
    borrows.value = await borrowApi.list({ ownerId: userStore.userId })
    const asBorrower = await borrowApi.list({ borrowerId: userStore.userId })
    const borrowSet = new Map(borrows.value.map(b => [b.id, b]))
    asBorrower.forEach(b => { if (!borrowSet.has(b.id)) borrows.value.push(b) })
  } catch (e) {}
  
  try {
    invitations.value = await invitationApi.listByUser(userStore.userId)
  } catch (e) {}
}

const updateBorrow = async (b, status) => {
  try {
    await ElMessageBox.confirm(`确认${status === 'confirmed' ? '同意' : '拒绝'}该借用申请？`, '提示', {
      type: status === 'confirmed' ? 'success' : 'warning'
    })
  } catch { return }
  
  try {
    await borrowApi.update(b.id, { status })
    ElMessage.success('操作成功')
    await loadAll()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmReturn = async (b) => {
  try {
    await ElMessageBox.confirm('确认乐器已完好归还？确认后将退还押金。', '归还确认', { type: 'success' })
  } catch { return }
  
  try {
    await borrowApi.update(b.id, { status: 'returned' })
    ElMessage.success('已确认归还')
    await loadAll()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const updateInvitation = async (inv, status) => {
  try {
    await ElMessageBox.confirm(`确认${status === 'accepted' ? '接受' : '拒绝'}该邀约？`, '提示', {
      type: status === 'accepted' ? 'success' : 'warning'
    })
  } catch { return }
  
  try {
    await invitationApi.update(inv.id, { status })
    ElMessage.success('操作成功')
    await loadAll()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const showReviewDialog = (target, type) => {
  currentTarget.value = target
  reviewForm.context = type === 'borrow' ? '乐器借用' : '陪练邀约'
  reviewForm.rating = 5
  reviewForm.content = ''
  showReview.value = true
}

const submitReview = async () => {
  if (!reviewForm.content) {
    ElMessage.warning('请填写评价内容')
    return
  }
  submitting.value = true
  try {
    const target = currentTarget.value
    const isBorrow = reviewForm.context === '乐器借用'
    const revieweeId = isBorrow ? target.ownerId : target.inviterId
    const targetId = isBorrow ? target.id : target.id
    const targetType = isBorrow ? 'borrow' : 'user'
    
    await reviewApi.create({
      reviewerId: userStore.userId,
      revieweeId,
      targetType,
      targetId,
      rating: reviewForm.rating,
      content: reviewForm.content,
      context: reviewForm.context
    })
    ElMessage.success('评价提交成功！')
    showReview.value = false
    await loadAll()
    await userStore.refreshUser()
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.msg-tabs {
  margin-top: 20px;
}

.tab-badge {
  margin-left: 6px;
}

.section {
  margin: 20px 0 30px;
}

.section h3 {
  font-size: 16px;
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 3px solid var(--primary-color);
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.msg-item {
  display: flex;
  gap: 16px;
  padding: 18px;
}

.msg-avatar {
  flex-shrink: 0;
}

.inst-thumb {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.msg-content {
  flex: 1;
  min-width: 0;
}

.msg-title {
  font-size: 15px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.msg-title b {
  color: var(--primary-color);
}

.msg-title a {
  font-weight: 500;
  color: var(--text-primary);
}

.msg-title a:hover {
  color: var(--primary-color);
}

.msg-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.msg-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.msg-body {
  padding: 10px 14px;
  background: var(--bg-light);
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.msg-actions {
  display: flex;
  gap: 10px;
}

.empty-state.small {
  padding: 40px 20px;
}

.empty-state.small .el-icon {
  font-size: 48px;
}
</style>
