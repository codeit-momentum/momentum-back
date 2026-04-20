import type { TestMessage } from '../models/testModel.js';
import { HELLOWORLD_1, HELLOWORLD_2 } from '../constants/testConstants.js';

export const getHelloWorld1 = async (): Promise<TestMessage> => {
  // 서비스 로직
  return {
    message: HELLOWORLD_1, // 'Hello World! 1';
  };
};

export const getHelloWorld2 = async (): Promise<string> => {
  // 서비스 로직
  return HELLOWORLD_2; // 'Hello World! 2';
};
