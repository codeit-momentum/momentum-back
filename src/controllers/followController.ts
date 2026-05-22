import type { NextFunction, Request, Response } from 'express';
import {
  followUser,
  getFollowerList,
  getFollowingList,
  unfollowUser,
  updateFollowFavorite,
} from '../services/followService.js';

// 사용자 팔로우
export const follow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const followerID = req.userId!;
    const { userID: followingID } = req.params as { userID: string };

    const data = await followUser({ followerID, followingID });
    res.status(201).json({ message: '팔로우가 완료되었습니다.', data });
  } catch (err) {
    next(err);
  }
};

// 팔로우 취소
export const unfollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const followerID = req.userId!;
    const { userID: followingID } = req.params as { userID: string };

    const data = await unfollowUser({ followerID, followingID });
    res.status(200).json({ message: '팔로우가 취소되었습니다.', data });
  } catch (err) {
    next(err);
  }
};

// 팔로우 즐겨찾기 설정
export const setFollowFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const followerID = req.userId!;
    const { userID: followingID } = req.params as { userID: string };
    const { isFavorite } = req.body as { isFavorite?: unknown };

    if (isFavorite === undefined) {
      res.status(400).json({ message: 'isFavorite가 필요합니다.' });
      return;
    }

    if (typeof isFavorite !== 'boolean') {
      res.status(400).json({ message: 'isFavorite는 boolean이어야 합니다.' });
      return;
    }

    const data = await updateFollowFavorite({ followerID, followingID, isFavorite });
    res.status(200).json({ message: '즐겨찾기 설정이 변경되었습니다.', data });
  } catch (err) {
    next(err);
  }
};

// 팔로잉 목록 조회
export const getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestUserID = req.userId!;
    const userID = requestUserID;

    const data = await getFollowingList({ userID, requestUserID });
    res.status(200).json({ message: '팔로잉 목록 조회 성공', data });
  } catch (err) {
    next(err);
  }
};

// 팔로워 목록 조회
export const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestUserID = req.userId!;
    const userID = requestUserID;

    const data = await getFollowerList({ userID, requestUserID });
    res.status(200).json({ message: '팔로워 목록 조회 성공', data });
  } catch (err) {
    next(err);
  }
};
