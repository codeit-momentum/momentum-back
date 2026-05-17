export interface FollowUserParams {
  followerID: string;
  followingID: string;
}

export interface UpdateFollowFavoriteParams extends FollowUserParams {
  isFavorite: boolean;
}

export interface GetFollowListParams {
  userID: string;
  requestUserID: string;
}

export const FOLLOW_USER_SELECT = {
  id: true,
  nickname: true,
  profile: true,
  userCode: true,
  isKnocked: true,
} as const;
