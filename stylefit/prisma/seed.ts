// 시드 스크립트: 빈 DB에 가짜 데이터를 채워 넣는 코드
// 실행 명령: npx prisma db seed

import {
  PrismaClient,
  ServiceVerificationStatus,
  SellerVerificationStatus,
  ServiceType,
  BookingStatus,
  UserRole,
} from "@prisma/client"
import bcrypt from "bcryptjs"

// Prisma 클라이언트: DB와 대화하는 도구
const prisma = new PrismaClient()

// 모든 시드 user 공통 비번 — 학습용 표준값
// (Day 11까지 "hashed_password_dummy" 더미값이라 시드 user로 로그인 불가했던 문제 해결)
// 시드 실행 시점에 bcrypt.hash로 *진짜 hash* 생성 → 모든 user에 재사용
const SEED_PASSWORD_PLAIN = "seed1234!"

// 날짜 헬퍼: 지금으로부터 N일 후(음수면 N일 전)의 Date 반환
//   예) daysFromNow(3)   → 3일 후
//       daysFromNow(-10) → 10일 전
const daysFromNow = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

// 분 단위 헬퍼: 메시지 같이 짧은 시간 간격을 표현할 때 사용
//   예) minutesFromNow(-30)   → 30분 전
//       minutesFromNow(-1440) → 24시간 전 (어제)
const minutesFromNow = (mins: number) => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + mins)
  return d
}

async function main() {
  console.log("시드 시작...")

  // 비번 hash를 한 번만 계산해서 9명 user에 재사용
  // (bcrypt.hash는 ~100ms로 느린 편 — 9번 호출하면 1초 가량 낭비)
  const seedPasswordHash = await bcrypt.hash(SEED_PASSWORD_PLAIN, 10)

  // 1) 기존 데이터 정리 (영역별 그룹화 — FK 역순과 자연스럽게 일치)
  //    매 실행마다 깨끗한 상태에서 시작하기 위함

  // 감사 로그 (Day 18) — User FK 가 ON DELETE RESTRICT 라 *가장 먼저* 비워야
  // user.deleteMany 가 실패하지 않음. 시드는 audit log 생성 안 함 (비어있는 채로 시작).
  await prisma.auditLog.deleteMany()

  // 셀러 활동 이력 (Day 20) — SellerProfile/Service FK Restrict.
  // sellerProfile/service.deleteMany 보다 먼저 비워야 함.
  await prisma.sellerActivityLog.deleteMany()

  // 메시지 영역
  await prisma.message.deleteMany()
  await prisma.messageThread.deleteMany()

  // 후기 영역
  await prisma.review.deleteMany()

  // 큐레이션 영역 (Day 12 — Service 삭제 전에 매핑 먼저 정리)
  await prisma.serviceCollection.deleteMany()
  await prisma.collection.deleteMany()

  // 거래 영역
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.sellerProfile.deleteMany()

  // 회원 영역
  await prisma.user.deleteMany()
  console.log("  기존 데이터 정리 완료")

  // 2) 구매자 5명 생성
  //    Booking에서 buyerId가 필요하므로 반환값을 변수에 저장
  const buyer1 = await prisma.user.create({
    data: {
      email: "minji.kim@example.com",
      passwordHash: seedPasswordHash,
      name: "김민지",
      agreedTermsAt: new Date(),
    },
  })
  const buyer2 = await prisma.user.create({
    data: {
      email: "seoyeon.park@example.com",
      passwordHash: seedPasswordHash,
      name: "박서연",
      agreedTermsAt: new Date(),
    },
  })
  const buyer3 = await prisma.user.create({
    data: {
      email: "doyoon.lee@example.com",
      passwordHash: seedPasswordHash,
      name: "이도윤",
      agreedTermsAt: new Date(),
    },
  })
  const buyer4 = await prisma.user.create({
    data: {
      email: "hajoon.choi@example.com",
      passwordHash: seedPasswordHash,
      name: "최하준",
      agreedTermsAt: new Date(),
    },
  })
  const buyer5 = await prisma.user.create({
    data: {
      email: "sua.jung@example.com",
      passwordHash: seedPasswordHash,
      name: "정수아",
      agreedTermsAt: new Date(),
    },
  })
  console.log("  구매자 5명 생성 완료")

  // 3) 셀러 4명 생성 (반환값을 변수로 저장 → 다음 단계에서 id 사용)
  const seller1 = await prisma.user.create({
    data: {
      email: "jiwon.kang@example.com",
      passwordHash: seedPasswordHash,
      name: "강지원",
      agreedTermsAt: new Date(),
    },
  })
  const seller2 = await prisma.user.create({
    data: {
      email: "chaerin.yoon@example.com",
      passwordHash: seedPasswordHash,
      name: "윤채린",
      agreedTermsAt: new Date(),
    },
  })
  const seller3 = await prisma.user.create({
    data: {
      email: "taemin.han@example.com",
      passwordHash: seedPasswordHash,
      name: "한태민",
      agreedTermsAt: new Date(),
    },
  })
  const seller4 = await prisma.user.create({
    data: {
      email: "hyunwoo.oh@example.com",
      passwordHash: seedPasswordHash,
      name: "오현우",
      agreedTermsAt: new Date(),
    },
  })
  console.log("  셀러 4명 User 생성 완료")

  // 4) SellerProfile 4개 (위에서 저장한 셀러 User의 id를 사용)
  //    3명은 approved + approvedAt 채움, 1명은 pending (미승인 흐름 테스트용)
  //    Service에서 sellerProfileId가 필요하므로 approved 셀러 3명의 반환값을 변수에 저장
  const profile1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1.id,
      bio: "디자인 컨설팅 전문가입니다.",
      specialty: "디자인 컨설팅",
      verificationStatus: SellerVerificationStatus.approved,
      approvedAt: new Date(),
    },
  })
  const profile2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2.id,
      bio: "웹사이트 제작 전문가입니다.",
      specialty: "웹사이트 제작",
      verificationStatus: SellerVerificationStatus.approved,
      approvedAt: new Date(),
    },
  })
  const profile3 = await prisma.sellerProfile.create({
    data: {
      userId: seller3.id,
      bio: "영상 편집·제작 전문가입니다.",
      specialty: "영상 편집·제작",
      verificationStatus: SellerVerificationStatus.approved,
      approvedAt: new Date(),
    },
  })
  // 오현우(seller4)는 pending이라 Service 등록 안 함 → 변수 저장 불필요
  await prisma.sellerProfile.create({
    data: {
      userId: seller4.id,
      bio: "블로그·콘텐츠 운영 전문가입니다.",
      specialty: "블로그·콘텐츠 운영",
      verificationStatus: SellerVerificationStatus.pending, // 미승인 — 어드민 화면 검증용
      // approvedAt: 미승인 상태라 null
    },
  })
  console.log("  SellerProfile 4개 생성 완료")

  // 5) Service 9개 (approved 셀러 3명 × 3개씩, pending 오현우는 0개)
  //    durationMinutes는 작업 시간 의미로 해석 (60분 컨설팅 ~ 14400분 = 10일 제작)
  //    Booking에서 사용할 6개만 변수에 저장(의미 영어 이름), 나머지 3개는 await만

  // 강지원(profile1) — 디자인 컨설팅 3개
  const portfolioReview = await prisma.service.create({
    data: {
      sellerProfileId: profile1.id,
      title: "포트폴리오 리뷰 1:1",
      description: "디자이너 포트폴리오를 1:1로 리뷰하고 개선점을 정리해드립니다.",
      serviceType: ServiceType.online,
      category: "디자인 컨설팅",
      price: 50000,
      durationMinutes: 60,
    },
  })
  await prisma.service.create({
    data: {
      sellerProfileId: profile1.id,
      title: "디자인 피드백 패키지",
      description: "작업물 3개를 받아 상세 피드백 문서로 전달합니다.",
      serviceType: ServiceType.online,
      category: "디자인 컨설팅",
      price: 80000,
      durationMinutes: 90,
    },
  })
  const designMentoring = await prisma.service.create({
    data: {
      sellerProfileId: profile1.id,
      title: "1:1 디자인 멘토링",
      description: "커리어·작업 고민을 1:1로 풀어드립니다.",
      serviceType: ServiceType.online,
      category: "디자인 컨설팅",
      price: 100000,
      durationMinutes: 90,
    },
  })

  // 윤채린(profile2) — 웹사이트 제작 3개
  const landingPage = await prisma.service.create({
    data: {
      sellerProfileId: profile2.id,
      title: "랜딩 페이지 제작",
      description: "단일 페이지 랜딩 사이트를 디자인+개발해드립니다.",
      serviceType: ServiceType.online,
      category: "웹사이트 제작",
      price: 300000,
      durationMinutes: 2880, // 2일 (24시간×2×60)
    },
  })
  const companySite = await prisma.service.create({
    data: {
      sellerProfileId: profile2.id,
      title: "회사 소개 사이트 (5p)",
      description: "5페이지 분량의 회사 소개 사이트 제작.",
      serviceType: ServiceType.online,
      category: "웹사이트 제작",
      price: 800000,
      durationMinutes: 7200, // 5일
    },
  })
  await prisma.service.create({
    data: {
      sellerProfileId: profile2.id,
      title: "디자인+개발 패키지",
      description: "기획부터 개발·배포까지 전 과정을 함께합니다.",
      serviceType: ServiceType.online,
      category: "웹사이트 제작",
      price: 1500000,
      durationMinutes: 14400, // 10일
    },
  })

  // 한태민(profile3) — 영상 편집·제작 3개
  const youtubeEdit = await prisma.service.create({
    data: {
      sellerProfileId: profile3.id,
      title: "유튜브 영상 편집 (10분)",
      description: "10분 내외의 유튜브 영상 컷편집·자막 작업.",
      serviceType: ServiceType.online,
      category: "영상 편집",
      price: 150000,
      durationMinutes: 1440, // 1일
    },
  })
  const adVideo = await prisma.service.create({
    data: {
      sellerProfileId: profile3.id,
      title: "1분 광고 영상 제작",
      description: "콘셉트 기획부터 제작까지 1분 광고 영상.",
      serviceType: ServiceType.online,
      category: "영상 제작",
      price: 500000,
      durationMinutes: 4320, // 3일
    },
  })
  await prisma.service.create({
    data: {
      sellerProfileId: profile3.id,
      title: "행사 현장 촬영+편집",
      description: "현장 촬영 후 1분 하이라이트 영상으로 편집.",
      serviceType: ServiceType.offline,
      category: "영상 제작",
      price: 600000,
      durationMinutes: 2880, // 2일
    },
  })
  console.log("  Service 9개 생성 완료")

  // 6) Booking 6개 (status 4종 모두 커버)
  //    pending 1 + confirmed 1 + completed 3 + cancelled 1
  //    날짜는 daysFromNow 헬퍼로 status 의미에 맞게 분산
  //    sellerProfileId는 비정규화 — Service 객체에서 직접 추출하여 정합성 자동 보장

  // (1) 김민지 → 강지원 포트폴리오 리뷰 — pending (셀러 미확정)
  await prisma.booking.create({
    data: {
      buyerId: buyer1.id,
      serviceId: portfolioReview.id,
      sellerProfileId: portfolioReview.sellerProfileId,
      preferredDatetime: daysFromNow(3), // 3일 후 희망
      confirmedDatetime: null, // 아직 미확정
      status: BookingStatus.pending,
      buyerMemo: "주중 저녁 가능합니다",
    },
  })

  // (2) 박서연 → 윤채린 랜딩 페이지 — confirmed (셀러 일정 확정)
  const bookingLandingPage = await prisma.booking.create({
    data: {
      buyerId: buyer2.id,
      serviceId: landingPage.id,
      sellerProfileId: landingPage.sellerProfileId,
      preferredDatetime: daysFromNow(7),
      confirmedDatetime: daysFromNow(7), // 동일 일정으로 확정
      status: BookingStatus.confirmed,
      buyerMemo: null,
    },
  })

  // (3) 이도윤 → 한태민 유튜브 편집 — completed
  const bookingYoutubeEdit = await prisma.booking.create({
    data: {
      buyerId: buyer3.id,
      serviceId: youtubeEdit.id,
      sellerProfileId: youtubeEdit.sellerProfileId,
      preferredDatetime: daysFromNow(-10),
      confirmedDatetime: daysFromNow(-10),
      status: BookingStatus.completed,
      buyerMemo: null,
    },
  })

  // (4) 최하준 → 강지원 1:1 멘토링 — completed
  const bookingDesignMentoring = await prisma.booking.create({
    data: {
      buyerId: buyer4.id,
      serviceId: designMentoring.id,
      sellerProfileId: designMentoring.sellerProfileId,
      preferredDatetime: daysFromNow(-15),
      confirmedDatetime: daysFromNow(-15),
      status: BookingStatus.completed,
      buyerMemo: "포트폴리오 방향성 고민",
    },
  })

  // (5) 정수아 → 윤채린 회사 소개 사이트 — completed
  const bookingCompanySite = await prisma.booking.create({
    data: {
      buyerId: buyer5.id,
      serviceId: companySite.id,
      sellerProfileId: companySite.sellerProfileId,
      preferredDatetime: daysFromNow(-20),
      confirmedDatetime: daysFromNow(-20),
      status: BookingStatus.completed,
      buyerMemo: "12월 오픈 목표입니다",
    },
  })

  // (6) 김민지(재구매) → 한태민 1분 광고 — cancelled (확정 전 취소)
  await prisma.booking.create({
    data: {
      buyerId: buyer1.id,
      serviceId: adVideo.id,
      sellerProfileId: adVideo.sellerProfileId,
      preferredDatetime: daysFromNow(5),
      confirmedDatetime: null,
      status: BookingStatus.cancelled,
      buyerMemo: null,
    },
  })
  console.log("  Booking 6개 생성 완료")

  // 7) Review 3개 (completed Booking 3개에 1:1 매칭)
  //    rating 4/5/3 분산, imageUrls는 모두 null
  //    비정규화 필드(buyerId, sellerProfileId)는 Booking 객체에서 자동 추출

  // (1) 이도윤 → 한태민 유튜브 편집 후기 (4점)
  await prisma.review.create({
    data: {
      bookingId: bookingYoutubeEdit.id,
      buyerId: bookingYoutubeEdit.buyerId,
      sellerProfileId: bookingYoutubeEdit.sellerProfileId,
      rating: 4,
      content: "자막 작업이 빠르고 정확했어요. 다음에도 부탁드리고 싶네요.",
    },
  })

  // (2) 최하준 → 강지원 1:1 멘토링 후기 (5점)
  await prisma.review.create({
    data: {
      bookingId: bookingDesignMentoring.id,
      buyerId: bookingDesignMentoring.buyerId,
      sellerProfileId: bookingDesignMentoring.sellerProfileId,
      rating: 5,
      content: "포트폴리오 방향성뿐 아니라 진로 고민까지 함께해주셔서 감사합니다.",
    },
  })

  // (3) 정수아 → 윤채린 회사 사이트 후기 (3점)
  await prisma.review.create({
    data: {
      bookingId: bookingCompanySite.id,
      buyerId: bookingCompanySite.buyerId,
      sellerProfileId: bookingCompanySite.sellerProfileId,
      rating: 3,
      content: "일정이 조금 늦어졌지만 결과는 만족합니다.",
    },
  })
  console.log("  Review 3개 생성 완료")

  // 8) MessageThread 2개 + Message 6개
  //    Thread #1: 예약 연결 케이스 (Booking 2 일정 조율) — 약 2시간 동안의 대화
  //    Thread #2: 사전 문의 케이스 (relatedBookingId null) — 어제쯤의 대화
  //    Thread/Message의 createdAt을 명시해 시간 분산 (실제 대화 흐름 시뮬레이션)
  //    저장은 UTC 절대 시점, 표시는 UI에서 사용자 시간대로 변환 예정

  // Thread #1 (박서연 ↔ 윤채린, Booking 2 랜딩 페이지) — 약 2시간 전 시작
  const thread1 = await prisma.messageThread.create({
    data: {
      buyerId: bookingLandingPage.buyerId,
      sellerProfileId: bookingLandingPage.sellerProfileId,
      relatedBookingId: bookingLandingPage.id,
      lastMessageAt: null, // 메시지 생성 후 update로 갱신
      createdAt: minutesFromNow(-121), // 첫 메시지보다 1분 앞서 생성
    },
  })

  // Thread #1의 메시지 4개 (마지막만 변수 저장 → update에 사용)
  // (1) 박서연 → 윤채린 — 2시간 전 (대화 시작)
  await prisma.message.create({
    data: {
      threadId: thread1.id,
      senderId: buyer2.id,
      content: "안녕하세요, 예약 시간 관련해서 문의드려요.",
      isRead: true,
      createdAt: minutesFromNow(-120),
    },
  })
  // (2) 윤채린 → 박서연 — 10분 뒤 답장
  await prisma.message.create({
    data: {
      threadId: thread1.id,
      senderId: seller2.id,
      content: "안녕하세요! 신청해주신 일정으로 진행 가능합니다.",
      isRead: true,
      createdAt: minutesFromNow(-110),
    },
  })
  // (3) 박서연 → 윤채린 — 50분 뒤 추가 질문
  await prisma.message.create({
    data: {
      threadId: thread1.id,
      senderId: buyer2.id,
      content: "감사합니다. 자료는 어디로 전달드리면 될까요?",
      isRead: true,
      createdAt: minutesFromNow(-60),
    },
  })
  // (4) 윤채린 → 박서연 — 30분 뒤 답장 (마지막, 미독)
  const thread1LastMsg = await prisma.message.create({
    data: {
      threadId: thread1.id,
      senderId: seller2.id,
      content: "이메일로 보내주시면 확인 후 답변드릴게요.",
      isRead: false,
      createdAt: minutesFromNow(-30),
    },
  })

  // Thread #1 update — 마지막 메시지 시간으로 lastMessageAt 갱신
  await prisma.messageThread.update({
    where: { id: thread1.id },
    data: { lastMessageAt: thread1LastMsg.createdAt },
  })

  // Thread #2 (이도윤 ↔ 강지원, 사전 문의 — relatedBookingId 없음) — 어제쯤 시작
  const thread2 = await prisma.messageThread.create({
    data: {
      buyerId: buyer3.id,
      sellerProfileId: profile1.id,
      relatedBookingId: null,
      lastMessageAt: null,
      createdAt: minutesFromNow(-1501), // 첫 메시지보다 1분 앞서
    },
  })

  // Thread #2의 메시지 2개
  // (1) 이도윤 → 강지원 — 약 25시간 전 (어제)
  await prisma.message.create({
    data: {
      threadId: thread2.id,
      senderId: buyer3.id,
      content: "안녕하세요, 포트폴리오 리뷰 서비스 문의드립니다.",
      isRead: true,
      createdAt: minutesFromNow(-1500),
    },
  })
  // (2) 강지원 → 이도윤 — 24시간 전 답장 (마지막, 미독)
  const thread2LastMsg = await prisma.message.create({
    data: {
      threadId: thread2.id,
      senderId: seller1.id,
      content: "어떤 분야 포트폴리오인지 알려주실 수 있을까요?",
      isRead: false,
      createdAt: minutesFromNow(-1440),
    },
  })

  // Thread #2 update — 마지막 메시지 시간으로 lastMessageAt 갱신
  await prisma.messageThread.update({
    where: { id: thread2.id },
    data: { lastMessageAt: thread2LastMsg.createdAt },
  })
  console.log("  MessageThread 2개 + Message 6개 생성 완료")

  // 9) Collection 2개 + ServiceCollection 매핑 (Day 12 — 큐레이션 도입)
  //    한 서비스가 *여러 컬렉션에 속할 수 있는* 다대다 관계가 진짜 작동하는지 검증용으로
  //    portfolioReview를 *featured + hot 둘 다*에 넣음.
  const featuredCollection = await prisma.collection.create({
    data: { slug: "featured", name: "에디터 추천", displayOrder: 1 },
  })
  const hotCollection = await prisma.collection.create({
    data: { slug: "hot", name: "지금 핫한 서비스", displayOrder: 2 },
  })

  // featured — 디자인 컨설팅 중심
  await prisma.serviceCollection.createMany({
    data: [
      { collectionId: featuredCollection.id, serviceId: portfolioReview.id, displayOrder: 1 },
      { collectionId: featuredCollection.id, serviceId: designMentoring.id, displayOrder: 2 },
      { collectionId: featuredCollection.id, serviceId: companySite.id, displayOrder: 3 },
    ],
  })

  // hot — 영상·큰 작업 중심. portfolioReview는 *featured와 겹침* (다대다 작동 증거)
  await prisma.serviceCollection.createMany({
    data: [
      { collectionId: hotCollection.id, serviceId: youtubeEdit.id, displayOrder: 1 },
      { collectionId: hotCollection.id, serviceId: adVideo.id, displayOrder: 2 },
      { collectionId: hotCollection.id, serviceId: portfolioReview.id, displayOrder: 3 },
    ],
  })
  console.log("  Collection 2개 + ServiceCollection 6개 생성 완료")

  // 10) 본인 계정 (개발자 본인 — buyer + seller 둘 다 작동)
  //     매번 시드 돌려도 본인 계정으로 로그인 가능하도록 시드에 포함.
  //     SellerProfile + Service 까지 만들어 seller 측 화면도 즉시 검증 가능.
  const me = await prisma.user.create({
    data: {
      email: "guun@forcs.com",
      passwordHash: seedPasswordHash,
      name: "GUUN",
      agreedTermsAt: new Date(),
      role: UserRole.admin, // Day 14 — 본인 GUUN은 admin (admin·seller 겸직). 다른 시드 user는 default "user".
    },
  })

  const myProfile = await prisma.sellerProfile.create({
    data: {
      userId: me.id,
      bio: "디자인 전공자, 학습용 계정입니다.",
      specialty: "UI/UX 디자인",
      verificationStatus: SellerVerificationStatus.approved,
      approvedAt: new Date(),
    },
  })

  const myService = await prisma.service.create({
    data: {
      sellerProfileId: myProfile.id,
      title: "UI/UX 디자인 1:1 컨설팅",
      description: "UI/UX 디자인 작업물·포트폴리오를 1:1로 컨설팅해드립니다.",
      serviceType: ServiceType.online,
      category: "디자인 컨설팅",
      price: 70000,
      durationMinutes: 60,
    },
  })
  console.log("  본인 계정 1명 (User + SellerProfile + Service) 생성 완료")

  // 10-A) GUUN 셀러 받은 예약 시드 (Day 21 — 셀러 액션 검증용)
  //   pending 2개 — [확정] [거절] 액션 테스트
  //   cancelled + rejectionReason 1개 — 이미 거절된 상태 표시 검증 (배지 "거절됨" + 사유 박스)
  //   buyer 측 검증은 김민지(buyer1) / 정수아(buyer5) 로 로그인해 /bookings 에서 확인.
  await prisma.booking.create({
    data: {
      buyerId: buyer1.id,
      serviceId: myService.id,
      sellerProfileId: myProfile.id,
      preferredDatetime: daysFromNow(4),
      confirmedDatetime: null,
      status: BookingStatus.pending,
      buyerMemo: "UI/UX 포트폴리오 피드백 받고 싶어요.",
    },
  })
  await prisma.booking.create({
    data: {
      buyerId: buyer3.id,
      serviceId: myService.id,
      sellerProfileId: myProfile.id,
      preferredDatetime: daysFromNow(6),
      confirmedDatetime: null,
      status: BookingStatus.pending,
      buyerMemo: null,
    },
  })
  await prisma.booking.create({
    data: {
      buyerId: buyer5.id,
      serviceId: myService.id,
      sellerProfileId: myProfile.id,
      preferredDatetime: daysFromNow(-2),
      confirmedDatetime: null,
      status: BookingStatus.cancelled,
      rejectionReason: "해당 일정에 이미 다른 작업이 잡혀 있어 부득이 거절합니다.",
      buyerMemo: "급하게 가능한 분 찾고 있어요.",
    },
  })
  console.log("  GUUN 셀러 받은 예약 3개 추가 (pending 2 + cancelled+사유 1)")

  // 11) 모든 시드 service를 verificationStatus="approved"로 일괄 표시 (Day 13)
  //     schema의 default가 "pending"이라 신규 등록은 검증 대기 상태로 시작.
  //     시드 데이터는 *운영 중인 검증된 서비스* 가정 → 일괄 approved.
  //     (각 service.create 호출에 verificationStatus를 일일이 박는 대신 한 번에 처리)
  await prisma.service.updateMany({
    data: { verificationStatus: ServiceVerificationStatus.approved },
  })
  console.log("  모든 시드 service를 approved로 표시 완료")

  // 12) admin 검증 대기 service 2개 (Day 14)
  //     verificationStatus default가 "pending"이라 명시 안 해도 pending.
  //     /admin/services 화면 진입 시 즉시 검증 대상으로 노출됨 (검증 흐름 학습용).
  //     *위 updateMany 다음에* 만들어야 approved로 덮이지 않음.
  await prisma.service.create({
    data: {
      sellerProfileId: profile1.id, // 강지원이 추가 등록한 시뮬레이션
      title: "디자인 시스템 구축",
      description: "토큰·컴포넌트 라이브러리·문서까지 풀스택 디자인 시스템 구축.",
      serviceType: ServiceType.online,
      category: "디자인 컨설팅",
      price: 2_000_000,
      durationMinutes: 14400, // 10일
      // verificationStatus 명시 안 함 → default "pending"
    },
  })
  await prisma.service.create({
    data: {
      sellerProfileId: profile2.id, // 윤채린이 추가 등록한 시뮬레이션
      title: "포트폴리오 사이트 (1p)",
      description: "1페이지 분량의 디자이너·작가 포트폴리오 사이트.",
      serviceType: ServiceType.online,
      category: "웹사이트 제작",
      price: 200_000,
      durationMinutes: 1440, // 1일
    },
  })
  console.log("  admin 검증 대기 service 2개 추가 (pending)")

  console.log("시드 완료!")
  console.log(`  ※ 모든 시드 user 비번: ${SEED_PASSWORD_PLAIN}`)
}

// 메인 함수 실행 + 에러 처리 + 연결 정리
main()
  .catch((e) => {
    console.error("시드 실패:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
