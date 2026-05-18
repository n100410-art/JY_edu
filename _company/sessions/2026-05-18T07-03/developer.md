# 💻 코다리 — 학생 활동 결과물 입력, 이전 활동 연계 검토, 교과 특성 맞춤 검증 로직을 처리할 백엔드/프론트엔드 아키텍처 초안 및 데이터 모델(Schema)을 설계하고 코딩 스켈레톤을 작성하시오.

💻 코다리: 작업 시작합니다.

CEO 지시사항이 명확하네요. 학생 활동 결과물 입력/분석, 이전 활동 연계 검토, 교과 특성 맞춤 검증까지 고려하면 단순한 CRUD를 넘어선 비즈니스 로직과 데이터의 복잡성이 존재합니다. 시니어 엔지니어로서 '왜?'와 '어떻게?'에 집중해서 아키텍처와 스켈레톤을 설계하겠습니다. ⚙️

현재 회사 공동 목표는 "학생이 제출한 활동 결과물을 입력 받아서 피드백해주는 앱 개발"입니다. 이를 위해 백엔드(FastAPI 기반으로 가정)와 프론트엔드(React/Next.js 기반으로 가정)의 데이터 모델과 기본적인 인터페이스를 설계하는 것이 합리적이라고 판단됩니다.

### 1. 아키텍처 초안 설계 (High-Level View)

*   **프론트엔드 (Client):** Next.js (TypeScript, React). 사용자 입력 폼 제공 및 결과 시각화 담당.
*   **백엔드 (Server):** FastAPI (Python, Pydantic). 비즈니스 로직(검증, 연계 분석)을 처리하고 데이터 영속성을 관리합니다.
*   **데이터베이스:** PostgreSQL (관계형 데이터 모델링에 적합).

### 2. 핵심 데이터 모델 (Schema Design - Python/Pydantic & SQL)

가장 중요한 엔티티는 학생(Student), 활동 기록(ActivityRecord), 교과목(Subject)입니다. 특히 `ActivityRecord`에 분석에 필요한 모든 메타데이터를 포함해야 합니다.

<create_file path="models/schema.py">
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

# --- Core Entities ---

class Subject(BaseModel):
    """교과목 정보 정의 (예: 수학, 국어)"""
    subject_id: str = Field(..., description="고유 교과목 식별자")
    name: str = Field(..., description="교과목 이름")
    description: str = Field(..., description="해당 교과의 주요 특성 및 평가 기준 (AI 검증 시 사용)")

class Student(BaseModel):
    """학생 정보"""
    student_id: str = Field(..., description="고유 학생 식별자")
    name: str = Field(..., description="학생 이름")
    grade: int = Field(..., description="학년")

# --- Activity & Feedback ---

class PreviousActivityReference(BaseModel):
    """이전 활동과의 연계성을 검토하기 위한 참조 정보"""
    activity_id: str  # 이전 기록의 ID
    linkage_type: str # 예: '심화', '연속성', '변주' 등
    notes: Optional[str] = None

class ActivityResult(BaseModel):
    """학생이 제출한 활동 결과물 (원본 데이터)"""
    activity_id: str = Field(..., description="현재 활동의 고유 ID")
    subject_id: str = Field(..., description="관련 교과목 ID")
    student_id: str = Field(..., description="학생 ID")
    title: str = Field(..., description="활동 제목")
    submission_date: date = Field(..., description="제출일")
    # 원본 텍스트 필드. LLM 분석의 주요 입력값.
    content_text: str = Field(..., description="학생이 작성한 활동 결과물 및 소감문 전체 텍스트.")

class ActivityReview(BaseModel):
    """시스템/교사가 수행하는 검토 및 피드백."""
    review_id: str = Field(..., description="검토 기록 고유 ID")
    activity_id: str = Field(..., description="관련 활동 ID")
    reviewer_id: str = Field(..., description="검토자 (교사/AI) ID")
    review_date: date = Field(..., description="검토 일자")
    # 1. 교과 특성 맞춤 검증 결과 (Pass/Fail + 상세 사유)
    subject_fit_check: bool = Field(..., description="해당 활동이 해당 교과의 성격에 적합한가?")
    subject_feedback: str = Field(..., description="교과 특성에 근거한 피드백")
    # 2. 이전 활동 연계성 검토 결과
    is_linked: bool = Field(..., description="이전 활동 기록과 의미 있는 연결고리가 존재하는가?")
    linkage_analysis: str = Field(..., description="연계성 분석 결과 및 제안 사항")
    # 3. 최종 평가서 작성을 위한 요약/판단 (최종 산출물에 사용)
    final_assessment_summary: str = Field(..., description="학생부 기록용 핵심 요약 문장")

class ActivityRecord(BaseModel):
    """모든 활동 데이터를 통합 관리하는 메인 레코드."""
    activity_id: str = Field(..., description="활동 기록 고유 ID (PK)")
    student_id: str
    subject_id: str
    result: ActivityResult
    reviews: List[ActivityReview] = []
    previous_references: List[PreviousActivityReference] = []

</create_file>

### 3. 백엔드 스켈레톤 (FastAPI Endpoint Draft)

데이터 모델이 준비되었으니, 이를 처리할 최소한의 API 엔드포인트를 정의합니다. 실제 분석 로직(LLM 호출 등)은 추후 `service` 계층에서 구현할 예정입니다.

<create_file path="backend/main.py">
from fastapi import FastAPI, HTTPException
from typing import List
from models.schema import ActivityRecord, Subject, Student, ActivityReview

app = FastAPI(title="JY_edu Assessment API", description="학생 활동 결과물 분석 및 평가서 자동화 백엔드")

# --- Mock DB & Services (Placeholder) ---
db: dict[str, ActivityRecord] = {} # 실제로는 SQLAlchemy/Alembic 사용 예정

@app.post("/subjects/", response_model=Subject)
def create_subject(subject: Subject):
    """새로운 교과목 특성 정의 등록."""
    # TODO: DB 저장 로직 구현
    return subject

@app.post("/activities/", response_model=ActivityRecord, status_code=201)
async def submit_activity(record: ActivityRecord):
    """학생 활동 결과물을 제출받고 초기 레코드를 생성."""
    if record.activity_id in db:
        raise HTTPException(status_code=409, detail="Activity ID already exists")
    db[record.activity_id] = record
    return record

@app.post("/activities/{activity_id}/review/", response_model=ActivityRecord)
async def perform_review(activity_id: str, review_data: ActivityReview):
    """제출된 활동에 대한 검토 및 피드백을 수행하고 기록."""
    if activity_id not in db:
        raise HTTPException(status_code=404, detail="Activity record not found")
    
    record = db[activity_id]
    # Review 객체를 리스트에 추가 (불변성 고려 필요)
    record.reviews.append(review_data) 
    db[activity_id] = record # Mock DB 업데이트
    return record

# --- Health Check ---
@app.get("/")
def read_root():
    return {"status": "OK", "service": "JY_edu Backend"}

</create_file>

### 4. 프론트엔드 스켈레톤 (Next.js Component Draft)

가장 핵심적인 입력 지점인 '활동 제출 및 검토 요청' 컴포넌트의 구조를 잡겠습니다. 이는 `ActivityRecord` 생성을 목표로 합니다.

<create_file path="frontend/components/ActivitySubmissionForm.tsx">
import React, { useState } from 'react';
import { ActivityResult, Subject, Student } from '../types/models'; // 타입 정의는 추후 분리 예정

interface SubmissionProps {
    onSubmit: (data: Omit<ActivityResult, 'activity_id'>) => Promise<void>;
}

const ActivitySubmissionForm: React.FC<SubmissionProps> = ({ onSubmit }) => {
    // Mock 상태 관리 - 실제로는 폼 라이브러리 사용 권장
    const [formData, setFormData] = useState({
        subjectId: '',
        studentId: '',
        title: '',
        submissionDate: new Date().toISOString().substring(0, 10),
        contentText: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 활동 ID는 백엔드에서 생성하도록 로직 변경 필요하나, 스켈레톤 유지를 위해 임시로 처리
            await onSubmit({
                ...formData,
                activity_id: `ACT-${Date.now()}` // Dummy ID
            });
            alert("활동 제출 요청 성공! 이제 검토 단계를 진행해주세요.");
        } catch (error) {
            console.error("Submission failed:", error);
            alert("제출 중 오류 발생. 콘솔 확인 필요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">새 활동 결과물 제출</h2>
            {/* Subject/Student 선택 필드 (실제로는 API 호출로 목록 받아와야 함) */}
            <div className="mb-3"><label>교과목:</label><input name="subjectId" value={formData.subjectId} onChange={handleChange} required /></div>
            <div className="mb-3"><label>학생:</label><input name="studentId" value={formData.studentId} onChange={handleChange} required /></div>
            
            <div className="mb-3"><label>활동 제목:</label><input name="title" value={formData.title} onChange={handleChange} required /></div>
            <div className="mb-3"><label>제출일:</label><input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleChange} required /></div>

            {/* 핵심 입력 필드: 분석 대상 텍스트 */}
            <div className="mb-4">
                <label htmlFor="contentText" className="block mb-1 font-medium">활동 결과물 및 소감문 (분석 대상):</label>
                <textarea
                    id="contentText"
                    name="contentText"
                    rows={10}
                    value={formData.contentText}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:ring-blue-500"
                />
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {isLoading ? '제출 중...' : '결과물 제출 및 분석 요청'}
            </button>
        </form>
    );
};

export default ActivitySubmissionForm;
</create_file>

### 4. 검증 및 다음 단계 계획

설계된 데이터 모델은 **활동 결과물(`content_text`)**, **교과 특성(`Subject.description`)**, **이전 활동 정보(`PreviousActivityReference`)**를 모두 포함하여 향후 AI 기반의 심층 분석을 수행할 수 있는 구조입니다. 백엔드 스켈레톤은 이 데이터를 받아들이는 기본 진입점을 제공하고 있습니다.

**자가 검증:**
1. 데이터 모델 (Pydantic): `ActivityResult`에 모든 핵심 필드가 정의되었으며, 특히 `content_text`가 분석 입력값으로 명확히 지정됨. ✅ [근거: 공동 목표 및 CEO 지시]
2. 백엔드 스켈레톤: 기본적인 CRUD 엔드포인트(등록/검토) 구조를 갖추고 있음. ✅ [근거: 시니어 엔지니어 역할 수행]
3. 프론트엔드 스켈레톤: 핵심 입력 폼(`ActivitySubmissionForm`)의 인터페이스가 정의되었으며, 데이터 흐름을 고려함. ✅ [근거: 웹사이트/봇 설계 능력]

**테스트:** 현재는 코딩 스켈레톤이므로 단위 테스트는 불가능합니다. 구조적인 유효성 검증(Schema Validation)은 Pydantic에 의존하고 있습니다. ⚙️

📊 평가: 완료 — 아키텍처 초안, 핵심 데이터 모델, 양쪽 스켈레톤을 성공적으로 설계 및 코딩했습니다.
📝 다음 단계: 백엔드 서비스 계층 구현 (LLM 연동 로직) 및 프론트엔드와 API 통합 테스트 환경 구축이 필요합니다.

---
## 📁 파일 액션 결과

✅ 생성: c:\Users\user\.gemini\antigravity\scratch\connect-ai\models\schema.py
✅ 생성: c:\Users\user\.gemini\antigravity\scratch\connect-ai\backend\main.py
✅ 생성: c:\Users\user\.gemini\antigravity\scratch\connect-ai\frontend\components\ActivitySubmissionForm.tsx
