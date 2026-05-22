// 버킷리스트 생성 파라미터
export interface CreateBucketParams {
  userID: string;
  title: string;
}

// 버킷리스트 상세 조회 파라미터
export interface GetBucketDetailParams {
  bucketID: string;
}

// 유저별 버킷리스트 조회 파라미터 (status 필터 포함)
export interface GetBucketsParams {
  userID: string;
  status?: 'completed' | 'challenging' | undefined;
}

// 버킷리스트 활성화/비활성화 파라미터
export interface BucketMutateParams {
  bucketID: string;
  requestUserID: string;
}
